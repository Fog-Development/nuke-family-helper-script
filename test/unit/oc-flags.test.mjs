import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { crimeHoursLeft, describeIdle, Flag, hoursUntilTurn, idleBadge, limitsFor, probablyRun, slotFlags } from "../../src/features/organized-crimes/flags.js";

const filled = (name, progress, cpr) => ({ name, cpr, occupied: true, progress });
const open = (name) => ({ name, cpr: 80, occupied: false, progress: 0 });
const limits = { thresholdHours: 12, levelGap: 2 };
const kinds = (flags) => flags.map((flag) => flag.flag);

// Join order: Alpha is done, Bravo is halfway, Charlie and Delta wait behind.
const crime = {
  name: "Break the Bank", level: 8,
  slots: [filled("Alpha", 1, 80), filled("Bravo", 0.5, 60), filled("Charlie", 0, 80), filled("Delta", 0, 80), open("Echo")],
};

describe("OC slot flags", () => {
  it("counts the planning owed by everyone who joined earlier", () => {
    assert.equal(hoursUntilTurn(crime, 0), 0);
    assert.equal(hoursUntilTurn(crime, 1), 0);
    assert.equal(hoursUntilTurn(crime, 2), 12);
    assert.equal(hoursUntilTurn(crime, 3), 36);
    assert.equal(crimeHoursLeft(crime), 12 + 24 + 24 + 24);
  });

  it("flags a CPR below the role minimum", () => {
    const flags = slotFlags(crime, 1, { minCpr: 63 }, null, limits);
    assert.deepEqual(kinds(flags), [Flag.Unqualified]);
    assert.equal(flags[0].text, "CPR 60 < 63");
    assert.deepEqual(slotFlags(crime, 1, { minCpr: 60 }, null, limits), []);
    assert.deepEqual(slotFlags(crime, 1, { minCpr: null }, null, limits), []);
  });

  it("flags a member whose planning starts later than the threshold, but not at it", () => {
    assert.deepEqual(slotFlags(crime, 2, { minCpr: 63 }, null, limits), []);
    const flags = slotFlags(crime, 3, { minCpr: 63 }, null, limits);
    assert.deepEqual(kinds(flags), [Flag.Unproductive]);
    assert.equal(flags[0].text, "Idle 36h");
    assert.deepEqual(slotFlags(crime, 3, { minCpr: 63 }, null, { ...limits, thresholdHours: 36 }), []);
  });

  it("flags a member well above the crime's level", () => {
    const easy = { ...crime, level: 5 };
    assert.deepEqual(kinds(slotFlags(easy, 0, { minCpr: 63 }, 7, limits)), [Flag.UnderLevel]);
    assert.deepEqual(slotFlags(easy, 0, { minCpr: 63 }, 6, limits), []);
    assert.deepEqual(slotFlags(easy, 0, { minCpr: 63 }, null, limits), [], "an unknown level flags nobody");
    assert.deepEqual(slotFlags(easy, 0, { minCpr: 63 }, 6, { ...limits, levelGap: 1 }).length, 1);
  });

  it("does not flag a level 9 or 10 member for being in a level 8 crime", () => {
    for (const level of [9, 10]) {
      assert.deepEqual(slotFlags({ ...crime, level: 8 }, 0, { minCpr: 63 }, level, { ...limits, levelGap: 1 }), []);
      assert.deepEqual(slotFlags({ ...crime, level: 7 }, 0, { minCpr: 63 }, level, limits), []);
      // Two below level 8 is still too easy for them, and says who they are.
      const flags = slotFlags({ ...crime, level: 6 }, 0, { minCpr: 63 }, level, limits);
      assert.deepEqual(kinds(flags), [Flag.UnderLevel]);
      assert.equal(flags[0].text, `Level ${level} member`);
    }
  });

  it("can raise several flags on one slot, and none on an empty one", () => {
    const flags = slotFlags({ ...crime, level: 5 }, 3, { minCpr: 90 }, 9, limits);
    assert.deepEqual(kinds(flags), [Flag.Unqualified, Flag.Unproductive, Flag.UnderLevel]);
    assert.deepEqual(slotFlags(crime, 4, { minCpr: 90 }, 9, limits), []);
  });

  it("uses a staff member's own thresholds over the faction's, and the faction's for everyone else", () => {
    const config = { settings: { productive_threshold_hours: 8, under_level_gap: 3 } };
    assert.deepEqual(limitsFor(config), { thresholdHours: 8, levelGap: 3, productiveFromLevel: 1 });
    assert.deepEqual(limitsFor(config, { thresholdHours: 20, levelGap: null }), { thresholdHours: 20, levelGap: 3, productiveFromLevel: 1 });
    assert.deepEqual(limitsFor(null), { thresholdHours: 12, levelGap: 2, productiveFromLevel: 1 });
  });

  it("calls nobody unproductive below the level the faction counts productive days from", () => {
    const from = (level) => limitsFor({ settings: { productive_from_level: level } });
    assert.equal(from(7).productiveFromLevel, 7);
    assert.equal(limitsFor({ settings: { productive_from_level: 7 } }, { thresholdHours: 1 }).productiveFromLevel, 7, "not a staff member's to override");

    // Delta waits 36 hours in a level 8 crime.
    assert.deepEqual(kinds(slotFlags(crime, 3, { minCpr: 63 }, null, from(8))), [Flag.Unproductive]);
    assert.deepEqual(slotFlags(crime, 3, { minCpr: 63 }, null, from(9)), []);
    assert.deepEqual(slotFlags(crime, 3, { minCpr: 63 }, null, from(null)), [], "never counted");
    assert.deepEqual(slotFlags({ ...crime, level: 10 }, 3, { minCpr: 63 }, null, from(null)), []);
    assert.deepEqual(kinds(slotFlags({ ...crime, level: null }, 3, { minCpr: 63 }, null, from(7))), [Flag.Unproductive], "an unknown level is taken as a high one");

    // The other flags do not depend on it.
    assert.deepEqual(kinds(slotFlags({ ...crime, level: 5 }, 3, { minCpr: 90 }, 9, from(7))), [Flag.Unqualified, Flag.UnderLevel]);
  });
});

describe("probablyRun", () => {
  const ready = 1_800_000_000;
  const at = (minutes) => (ready + minutes * 60) * 1000;

  it("assumes a crime ran once its ready time has passed", () => {
    assert.equal(probablyRun(ready, at(1)), true);
    assert.equal(probablyRun(ready, at(59)), true);
  });

  it("does not before the ready time, or without one", () => {
    assert.equal(probablyRun(ready, at(-1)), false);
    assert.equal(probablyRun(null, at(5)), false);
    assert.equal(probablyRun(undefined, at(5)), false);
  });

  it("trusts the board again once the crime is long overdue", () => {
    assert.equal(probablyRun(ready, at(61)), false);
  });
});

describe("idle member badges", () => {
  const now = 2_000_000_000 * 1000;
  const hoursAgo = (hours) => now / 1000 - hours * 3600;

  it("says roughly how long since the last OC", () => {
    assert.equal(describeIdle(0), "<1h");
    assert.equal(describeIdle(59 * 60), "<1h");
    assert.equal(describeIdle(5.5 * 3600), "5h");
    assert.equal(describeIdle(47.9 * 3600), "47h");
    assert.equal(describeIdle(49 * 3600), "2d");
    assert.equal(describeIdle(-10), "<1h");
  });

  it("shows the level and colours the wait by how long it has been", () => {
    assert.deepEqual(
      [5, 30, 80].map((hours) => idleBadge({ level: 7, not_in_oc_since: hoursAgo(hours) }, now)).map((b) => [b.level, b.idle, b.tone]),
      [["L7", "5h", "ok"], ["L7", "30h", "warn"], ["L7", "3d", "alert"]],
    );
  });

  it("copes with an unknown level, an unknown time and an unknown member", () => {
    const badge = idleBadge({ level: null, not_in_oc_since: null }, now);
    assert.equal(badge.level, "L?");
    assert.equal(badge.idle, null);
    assert.equal(idleBadge({ level: 6 }, now).idle, null, "an older site sends no time");
    assert.equal(idleBadge(undefined, now), null);
  });
});
