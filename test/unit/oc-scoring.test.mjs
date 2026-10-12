import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findRole, keyFor } from "../../src/features/organized-crimes/catalog.js";
import {
  describeWait,
  hoursUntilPlanning,
  Rank,
  rateCrimes,
  SlotStatus,
} from "../../src/features/organized-crimes/scoring.js";

const role = (name, weight, minCpr) => ({ key: keyFor(name), name, weight, min_cpr: minCpr });

const config = {
  settings: { productive_threshold_hours: 12, under_level_gap: 2 },
  fallback_min_cpr: { default: 65, 8: 60 },
  crimes: [
    {
      key: "breakthebank", name: "Break the Bank", level: 8,
      roles: [role("Muscle #1", 13.5, 63), role("Muscle #3", 31.7, 72), role("Thief #1", 2.9, 50)],
    },
    { key: "blastfromthepast", name: "Blast from the Past", level: 7, roles: [role("Muscle", 34.6, 77), role("Hacker", 12.1, 66)] },
    { key: "honeytrap", name: "Honey Trap", level: 5, roles: [role("Enforcer", 27, 65)] },
    { key: "guardianangels", name: "Guardian Ángels", level: 5, roles: [role("Hustler", 42.1, 70)] },
  ],
};

const open = (name, cpr) => ({ name, cpr, occupied: false, progress: 0 });
const filled = (name, progress, cpr = 80) => ({ name, cpr, occupied: true, progress });
const crime = (id, name, level, slots) => ({ id, name, level, slots });

describe("OC catalog lookups", () => {
  it("matches names however they are spelled", () => {
    assert.equal(keyFor("Muscle #1"), "muscle1");
    assert.equal(keyFor("Muscle 1"), "muscle1");
    assert.equal(keyFor("Guardian Ángels"), "guardianangels");
    assert.equal(keyFor("GuardianAngels"), "guardianangels");
    assert.equal(findRole(config, "Guardian Ángels", "Hustler").min_cpr, 70);
    assert.equal(findRole(config, "Break The Bank", "Thief #1").weight, 2.9);
  });

  it("returns null for a crime or role the site does not know", () => {
    assert.equal(findRole(config, "Ship Happens", "Spy"), null);
    assert.equal(findRole(config, "Break the Bank", "Driver"), null);
    assert.equal(findRole(null, "Break the Bank", "Robber"), null);
  });
});

describe("hours until planning starts", () => {
  it("is the planning still owed by everyone already in the crime", () => {
    assert.equal(hoursUntilPlanning(crime(1, "X", 1, [open("A", 70)])), 0);
    assert.equal(hoursUntilPlanning(crime(1, "X", 1, [filled("A", 1), filled("B", 1), open("C", 70)])), 0);
    assert.equal(hoursUntilPlanning(crime(1, "X", 1, [filled("A", 0.5), filled("B", 0), open("C", 70)])), 36);
  });

  it("is described in plain words", () => {
    assert.equal(describeWait(0), "now");
    assert.equal(describeWait(0.8), "in about 1 hour");
    assert.equal(describeWait(7.4), "in about 7 hours");
    assert.equal(describeWait(107), "in about 4 days");
  });
});

describe("slot rating", () => {
  it("marks each slot against the faction's minimum", () => {
    const { crimes } = rateCrimes(
      [crime(1, "Break the Bank", 8, [filled("Thief #1", 1), open("Muscle #1", 63), open("Muscle #3", 71), open("Driver", 90)])],
      config,
    );
    assert.deepEqual(
      crimes[0].slots.map((rated) => [rated.slot.name, rated.status, rated.minCpr]),
      [
        ["Thief #1", SlotStatus.Filled, 50],
        ["Muscle #1", SlotStatus.Eligible, 63],
        ["Muscle #3", SlotStatus.Below, 72],
        ["Driver", SlotStatus.Eligible, 60],
      ],
    );
    assert.equal(crimes[0].slots[3].assumed, true, "a role the site does not list goes on the level's fallback");
    assert.equal(crimes[0].slots[1].assumed, false);
  });

  it("still suggests a crime too new to have weights, on CPR and level alone", () => {
    const shipHappens = crime(9, "Ship Happens", 8, [open("Spy", 73), open("Engineer", 78), open("Hustler", 55)]);

    // On its own: the role the member is best at, since no role is known to matter more.
    let { crimes, suggestions } = rateCrimes([shipHappens], config);
    assert.deepEqual(crimes[0].slots.map((rated) => rated.status), [SlotStatus.Eligible, SlotStatus.Eligible, SlotStatus.Below]);
    assert.equal(suggestions[0].rated.slot.name, "Engineer");
    assert.equal(suggestions[0].rated.weight, null);
    assert.equal(suggestions[0].rated.minCpr, 60);

    // Beside an equal crime we have weights for: suggested, but after it.
    ({ suggestions } = rateCrimes([shipHappens, crime(3, "Break the Bank", 8, [filled("Thief #1", 0.75), open("Muscle #1", 80)])], config));
    assert.deepEqual(suggestions.map((s) => [s.crime.id, s.rank]), [[3, Rank.Best], [9, Rank.Good]]);

    // Its level still counts: it beats a lower-level crime we know everything about.
    ({ suggestions } = rateCrimes([crime(1, "Blast from the Past", 7, [open("Hacker", 80)]), shipHappens], config));
    assert.deepEqual(suggestions.map((s) => s.crime.id), [9, 1]);
  });

  it("uses a weight for a new crime once the site has one", () => {
    const withWeights = structuredClone(config);
    withWeights.crimes.push({
      key: "shiphappens", name: "Ship Happens", level: 8,
      roles: [{ ...role("Spy", 45, 70), weight_source: "manual" }, role("Engineer", null, 60)],
    });
    const { suggestions } = rateCrimes([crime(9, "Ship Happens", 8, [open("Spy", 73), open("Engineer", 78)])], withWeights);
    assert.equal(suggestions[0].rated.slot.name, "Spy");
  });

  it("leaves a slot unrated when the member's CPR for it is not known", () => {
    const { crimes, suggestions } = rateCrimes([crime(1, "Break the Bank", 8, [open("Muscle #1", null)])], config);
    assert.equal(crimes[0].slots[0].status, SlotStatus.Unrated);
    assert.deepEqual(suggestions, []);
  });

  it("suggests the heaviest role the member qualifies for", () => {
    const { suggestions } = rateCrimes(
      [crime(1, "Break the Bank", 8, [open("Thief #1", 80), open("Muscle #1", 80), open("Muscle #3", 80)])],
      config,
    );
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0].rank, Rank.Best);
    assert.equal(suggestions[0].rated.slot.name, "Muscle #3");
  });

  it("leaves a low-CPR member the light role", () => {
    const { suggestions } = rateCrimes(
      [crime(1, "Break the Bank", 8, [open("Thief #1", 55), open("Muscle #1", 55), open("Muscle #3", 55)])],
      config,
    );
    assert.equal(suggestions[0].rated.slot.name, "Thief #1");
  });

  it("prefers a slot that starts soon over a higher level that would leave the member waiting", () => {
    const { suggestions } = rateCrimes(
      [
        crime(1, "Break the Bank", 8, [filled("Thief #1", 0), filled("Muscle #3", 0), open("Muscle #1", 80)]),
        crime(2, "Blast from the Past", 7, [filled("Muscle", 0.75), open("Hacker", 80)]),
      ],
      config,
    );
    assert.equal(suggestions[0].crime.id, 2);
    assert.equal(suggestions[0].productive, true);
    assert.equal(suggestions[0].waitHours, 6);
    assert.equal(suggestions.length, 1, "a slot with a long wait is not 'good' beside a productive one");
  });

  it("prefers the higher level, then the shorter wait, among productive slots", () => {
    const { suggestions } = rateCrimes(
      [
        crime(1, "Blast from the Past", 7, [open("Hacker", 80)]),
        crime(2, "Break the Bank", 8, [filled("Thief #1", 0.75), open("Muscle #1", 80)]),
        crime(3, "Break the Bank", 8, [open("Muscle #1", 80)]),
      ],
      config,
    );
    assert.deepEqual(suggestions.map((s) => [s.crime.id, s.rank]), [[3, Rank.Best], [2, Rank.Good], [1, Rank.Good]]);
  });

  it("does not call a far easier crime good", () => {
    const { suggestions } = rateCrimes(
      [crime(1, "Break the Bank", 8, [open("Muscle #1", 80)]), crime(2, "Honey Trap", 5, [open("Enforcer", 80)])],
      config,
    );
    assert.deepEqual(suggestions.map((s) => s.crime.id), [1]);
  });

  it("still names the best slot when nothing would start within the threshold", () => {
    const { suggestions } = rateCrimes(
      [crime(1, "Break the Bank", 8, [filled("Thief #1", 0), open("Muscle #1", 80)])],
      config,
    );
    assert.equal(suggestions[0].rank, Rank.Best);
    assert.equal(suggestions[0].productive, false);
  });

  it("suggests nothing when the member qualifies for no open slot", () => {
    const { suggestions } = rateCrimes(
      [crime(1, "Break the Bank", 8, [open("Muscle #3", 60)]), crime(2, "Ship Happens", 8, [open("Spy", 59)])],
      config,
    );
    assert.deepEqual(suggestions, []);
  });
});
