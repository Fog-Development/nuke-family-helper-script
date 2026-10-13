import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findRole, keyFor } from "../../src/features/organized-crimes/catalog.js";
import {
  belowMemberLevel,
  belowOwnLevel,
  canAskForCrime,
  describeWait,
  hoursUntilPlanning,
  memberFeatures,
  productiveFromLevel,
  Rank,
  rateCrimes,
  SlotStatus,
  spawnTierToRequest,
  tierFor,
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
    assert.equal(suggestions[0].thresholdHours, 12);
  });

  it("suggests nothing when the member qualifies for no open slot", () => {
    const { suggestions } = rateCrimes(
      [crime(1, "Break the Bank", 8, [open("Muscle #3", 60)]), crime(2, "Ship Happens", 8, [open("Spy", 59)])],
      config,
    );
    assert.deepEqual(suggestions, []);
  });
});

describe("the level productive days count from", () => {
  const from = (level) => ({ ...config, settings: { ...config.settings, productive_from_level: level } });

  it("is everywhere for a site too old to say, and nowhere when the faction never counts them", () => {
    assert.equal(productiveFromLevel(config), 1);
    assert.equal(productiveFromLevel(null), 1);
    assert.equal(productiveFromLevel(from(7)), 7);
    assert.ok(productiveFromLevel(from(null)) > 10);
  });

  it("stops a long wait counting against a crime below it", () => {
    // Honey Trap (5) is the only crime open, behind someone who has not started.
    const crimes = [crime(1, "Honey Trap", 5, [filled("Muscle #1", 0), open("Enforcer", 80)])];
    const counted = rateCrimes(crimes, from(5)).suggestions[0];
    assert.deepEqual([counted.pooled, counted.productive, counted.waitHours], [true, false, 24]);
    const notCounted = rateCrimes(crimes, from(7)).suggestions[0];
    assert.deepEqual([notCounted.pooled, notCounted.productive], [false, true]);
    assert.equal(rateCrimes(crimes, from(null)).suggestions[0].productive, true);
  });

  it("points at the crime closest to full below it, and the soonest start at or above it", () => {
    const pair = (level, name, role) => [
      crime(1, name, level, [open(role, 80), open("Spare", null), open("Other", null)]),
      crime(2, name, level, [filled("Spare", 0), filled("Other", 0), open(role, 80)]),
    ];
    // Level 5, not counted: the crime with one slot left, despite its 48 hour queue.
    assert.deepEqual(rateCrimes(pair(5, "Honey Trap", "Enforcer"), from(7)).suggestions.map((s) => s.crime.id), [2, 1]);
    // Level 8, counted: the empty crime, where planning starts now.
    assert.deepEqual(rateCrimes(pair(8, "Break the Bank", "Muscle #1"), from(7)).suggestions.map((s) => s.crime.id), [1]);
    // Never counted: closest to full at every level.
    assert.deepEqual(rateCrimes(pair(8, "Break the Bank", "Muscle #1"), from(null)).suggestions.map((s) => s.crime.id), [2, 1]);
  });

  it("still prefers the higher level, and a crime where days count that starts in time", () => {
    const { suggestions } = rateCrimes(
      [
        crime(1, "Honey Trap", 5, [open("Enforcer", 80)]),
        crime(2, "Blast from the Past", 7, [filled("Muscle", 0.75), open("Hacker", 80)]),
        crime(3, "Break the Bank", 8, [filled("Thief #1", 0), open("Muscle #1", 80)]),
      ],
      from(7),
    );
    // Break the Bank would leave them idle a day, so it comes last.
    assert.deepEqual(suggestions.map((s) => s.crime.id), [2]);
    assert.equal(suggestions[0].pooled, true);
  });
});

describe("what a faction lets its members see", () => {
  const withSettings = (settings) => memberFeatures({ settings: { spawn_requests_enabled: true, ...settings } });
  const all = { enabled: true, suggest: true, warn: true, minimums: true, spawn: true };

  it("is everything for a site too old to send the switches", () => {
    assert.deepEqual(withSettings({}), all);
    assert.deepEqual(memberFeatures(null), { ...all, spawn: false });
  });

  it("switches each part off on its own", () => {
    assert.deepEqual(withSettings({ suggest_slots: false }), { ...all, suggest: false });
    assert.deepEqual(withSettings({ warn_poor_slot: false }), { ...all, warn: false });
    assert.deepEqual(withSettings({ spawn_requests_enabled: false }), { ...all, spawn: false });
  });

  it("only hides minimum CPRs when nothing is suggested or warned about", () => {
    assert.equal(withSettings({ show_min_cpr: false }).minimums, true);
    assert.equal(withSettings({ show_min_cpr: false, suggest_slots: false }).minimums, true);
    assert.equal(withSettings({ show_min_cpr: false, warn_poor_slot: false }).minimums, true);
    assert.equal(withSettings({ show_min_cpr: false, suggest_slots: false, warn_poor_slot: false }).minimums, false);
  });

  it("switches all of it off with the assistant", () => {
    assert.deepEqual(withSettings({ assistant_enabled: false }), { enabled: false, suggest: false, warn: false, minimums: false, spawn: false });
  });
});

describe("crimes below the member's level", () => {
  const eight = crime(1, "Break the Bank", 8, [filled("Thief #1", 0), open("Muscle #1", 80)]);
  const seven = crime(2, "Blast from the Past", 7, [open("Hacker", 80)]);
  const five = crime(3, "Honey Trap", 5, [open("Enforcer", 80)]);
  const other = crime(4, "Guardian \u00c1ngels", 5, [open("Hustler", 80)]);
  const eightNow = crime(5, "Break the Bank", 8, [open("Muscle #1", 80)]);
  const picks = (crimes, member) =>
    rateCrimes(crimes, config, member).suggestions.map((s) => [s.crime.id, s.rank, s.belowLevel]);

  it("uses the under-levelled gap, and nothing when a level is not known", () => {
    assert.equal(belowMemberLevel({ level: 6 }, 8, 2), true);
    assert.equal(belowMemberLevel({ level: 7 }, 8, 2), false);
    assert.equal(belowMemberLevel({ level: 6 }, null, 2), false);
    assert.equal(belowMemberLevel({ level: null }, 8, 2), false);
  });

  it("holds a member to their own level where productive days count, and to the gap below that", () => {
    const from = (level) => ({ ...config, settings: { ...config.settings, productive_from_level: level } });
    assert.equal(belowOwnLevel({ level: 7 }, 8, from(7)), true);
    assert.equal(belowOwnLevel({ level: 8 }, 8, from(7)), false);
    assert.equal(belowOwnLevel({ level: 9 }, 8, from(7)), false);
    // A level 6 member is below the cut-off: one level down is fine.
    assert.equal(belowOwnLevel({ level: 5 }, 6, from(7)), false);
    assert.equal(belowOwnLevel({ level: 4 }, 6, from(7)), true);
    // A faction that never counts productive days only has the gap.
    assert.equal(belowOwnLevel({ level: 7 }, 8, from(null)), false);
    assert.equal(belowOwnLevel({ level: 7 }, null, from(7)), false);
  });

  it("are not suggested to a member who can ask staff for a crime, when far below", () => {
    const result = rateCrimes([five, other], config, { level: 8, canAsk: true });
    assert.deepEqual(result.suggestions, []);
    assert.equal(result.withheld, 2);
  });

  it("are a flagged last resort when only just below, whether or not the member can ask", () => {
    for (const canAsk of [true, false]) {
      assert.deepEqual(picks([seven, five], { level: 8, canAsk }).slice(0, 1), [[2, Rank.Best, true]]);
    }
    assert.equal(rateCrimes([seven], config, { level: 8, canAsk: true }).suggestions[0].memberLevel, 8);
    // Where productive days never count, one level down is as good as any.
    const never = { ...config, settings: { ...config.settings, productive_from_level: null } };
    assert.equal(rateCrimes([seven], never, { level: 8, canAsk: true }).suggestions[0].belowLevel, false);
  });

  it("are the best available, and never good, for a member who cannot ask", () => {
    assert.deepEqual(picks([five, other], { level: 8, canAsk: false }), [[4, Rank.Best, true]]);
    assert.equal(rateCrimes([five, other], config, { level: 8, canAsk: false }).withheld, 0);
    // A good slot must be in range of the member as well as of the best crime.
    assert.deepEqual(picks([crime(5, "Break the Bank", 8, [open("Muscle #1", 80)]), seven], { level: 8, canAsk: true }), [
      [5, Rank.Best, false],
    ]);
    assert.deepEqual(picks([crime(5, "Break the Bank", 8, [open("Muscle #1", 80)]), seven], { level: 8, canAsk: false }), [
      [5, Rank.Best, false],
    ]);
  });

  describe("for a level 9 or 10 member, who has no crime of their own level to ask for", () => {
    const nine = crime(6, "Hostile Takeover", 9, [open("Muscle #1", 80)]);
    const lateNine = crime(7, "Hostile Takeover", 9, [filled("Hacker", 0), open("Muscle #1", 80)]);

    it("does not count a level 8 crime as below their level, but anything under it still is", () => {
      for (const level of [9, 10]) {
        assert.equal(belowOwnLevel({ level: 8 }, level, config), false);
        assert.equal(belowOwnLevel({ level: 7 }, level, config), true);
        assert.equal(belowMemberLevel({ level: 7 }, level, 2), false);
        assert.equal(belowMemberLevel({ level: 6 }, level, 2), true);
      }
      assert.equal(belowOwnLevel({ level: 9 }, 10, config), false);
    });

    it("suggests a level 8 crime, unflagged, when no level 9 or 10 one suits them", () => {
      for (const level of [9, 10]) {
        assert.deepEqual(picks([eightNow, seven], { level, canAsk: true }), [[5, Rank.Best, false]]);
        // A level 9 crime that would leave them waiting does not suit them.
        assert.deepEqual(picks([lateNine, eightNow], { level, canAsk: true })[0], [5, Rank.Best, false]);
      }
    });

    it("keeps to their own levels when one does suit them", () => {
      assert.deepEqual(picks([eightNow, nine], { level: 9, canAsk: true }), [[6, Rank.Best, false]]);
      assert.deepEqual(picks([eightNow, nine], { level: 10, canAsk: true }), [[6, Rank.Best, false]]);
      // A level 8 member is offered both, as before.
      assert.deepEqual(picks([eightNow, nine], { level: 8, canAsk: true }), [[6, Rank.Best, false], [5, Rank.Good, false]]);
    });

    it("still flags a level 7 crime as a last resort", () => {
      assert.deepEqual(picks([seven], { level: 10, canAsk: true }), [[2, Rank.Best, true]]);
    });
  });

  it("leave an unproductive crime at the member's level as the one suggested when they can ask", () => {
    // Break the Bank starts in 24 hours; Honey Trap now, but it is level 5.
    assert.deepEqual(picks([eight, five], { level: 8, canAsk: true }), [[1, Rank.Best, false]]);
    assert.deepEqual(picks([eight, five], { level: 8, canAsk: false }), [[3, Rank.Best, true]]);
  });

  it("change nothing while the member's level is not known", () => {
    assert.deepEqual(picks([five, other], { level: null, canAsk: false }), [[4, Rank.Best, false], [3, Rank.Good, false]]);
    assert.deepEqual(picks([five, other], null), [[4, Rank.Best, false], [3, Rank.Good, false]]);
  });
});

describe("asking staff for a crime", () => {
  const settings = { ...config.settings, spawn_requests_enabled: true, spawn_request_min_level: 6 };
  const allowed = { ...config, settings };
  const best = (level, productive) => [{ crime: { level }, productive }];

  it("maps levels onto Torn's spawn tiers", () => {
    // There is no asking for a level 9-10 crime: they are not spawned directly.
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tierFor), ["1-2", "1-2", "3-4", "3-4", "5-6", "5-6", "7-8", "7-8", "7-8", "7-8"]);
  });

  it("is offered when nothing decent is open at the member's level", () => {
    assert.equal(spawnTierToRequest([], 8, allowed), "7-8", "no slot at all");
    assert.equal(spawnTierToRequest(best(8, false), 8, allowed), "7-8", "the best would leave them waiting");
    assert.equal(spawnTierToRequest(best(6, true), 8, allowed), "7-8", "the best is two levels too easy");
    assert.equal(spawnTierToRequest(best(5, true), 9, allowed), "7-8");
    assert.equal(spawnTierToRequest([], 10, allowed), "7-8");
    assert.equal(spawnTierToRequest(best(7, true), 10, allowed), "7-8", "level 7 is still below a level 10 member");
    assert.equal(spawnTierToRequest(best(8, false), 9, allowed), "7-8");
  });

  it("is not offered when a decent slot exists", () => {
    assert.equal(spawnTierToRequest(best(8, true), 8, allowed), null);
    assert.equal(spawnTierToRequest(best(7, true), 8, allowed), "7-8", "one level down still costs productive days");
    const never = { ...allowed, settings: { ...settings, productive_from_level: null } };
    assert.equal(spawnTierToRequest(best(7, true), 8, never), null, "one level down is within the gap where they never count");
    assert.equal(spawnTierToRequest(best(6, true), 8, never), "7-8");
    assert.equal(spawnTierToRequest(best(9, true), 8, allowed), null);
    assert.equal(spawnTierToRequest(best(8, true), 9, allowed), null, "a level 8 slot is decent for a level 9 member");
    assert.equal(spawnTierToRequest(best(8, true), 10, allowed), null);
    assert.equal(spawnTierToRequest(best(10, true), 10, allowed), null);
  });

  it("is never offered below the faction's minimum level, without a known level, or when switched off", () => {
    assert.equal(spawnTierToRequest([], 5, allowed), null);
    assert.equal(canAskForCrime(8, allowed), true);
    assert.equal(canAskForCrime(5, allowed), false);
    assert.equal(canAskForCrime(null, allowed), false);
    assert.equal(canAskForCrime(8, config), false);
    assert.equal(spawnTierToRequest([], null, allowed), null);
    assert.equal(spawnTierToRequest([], 8, { ...config, settings: { ...settings, spawn_requests_enabled: false } }), null);
    assert.equal(spawnTierToRequest([], 8, { ...config, settings: { ...settings, spawn_request_min_level: 9 } }), null);
    assert.equal(spawnTierToRequest([], 8, { ...config, settings: { ...settings, assistant_enabled: false } }), null);
  });
});
