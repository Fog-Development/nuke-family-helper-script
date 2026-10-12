import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { crimeHoursLeft, Flag, hoursUntilTurn, limitsFor, slotFlags } from "../../src/features/organized-crimes/flags.js";

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

  it("can raise several flags on one slot, and none on an empty one", () => {
    const flags = slotFlags({ ...crime, level: 5 }, 3, { minCpr: 90 }, 9, limits);
    assert.deepEqual(kinds(flags), [Flag.Unqualified, Flag.Unproductive, Flag.UnderLevel]);
    assert.deepEqual(slotFlags(crime, 4, { minCpr: 90 }, 9, limits), []);
  });

  it("uses a staff member's own thresholds over the faction's, and the faction's for everyone else", () => {
    const config = { settings: { productive_threshold_hours: 8, under_level_gap: 3 } };
    assert.deepEqual(limitsFor(config), { thresholdHours: 8, levelGap: 3 });
    assert.deepEqual(limitsFor(config, { thresholdHours: 20, levelGap: null }), { thresholdHours: 20, levelGap: 3 });
    assert.deepEqual(limitsFor(null), { thresholdHours: 12, levelGap: 2 });
  });
});
