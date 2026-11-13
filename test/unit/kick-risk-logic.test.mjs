import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { changeText, kickReason, REASON_LIMIT, riskTier } from "../../src/features/kick-risk/logic.js";

const stats = [
  { key: "avg_daily_energy_spend_7", label: "avgE7", value: 120.4 },
  { key: "avg_daily_energy_spend_30", label: "avgE30", value: 422 },
  { key: "average_daily_xanax_taken_30_days", label: "Xanax Daily", value: 1.24 },
];

describe("kick risk logic", () => {
  it("uses the monitor's tiers", () => {
    assert.deepEqual([null, 3, 15, 24.9, 25, 35, 80].map(riskTier), [null, "low", "elevated", "elevated", "moderate", "high", "high"]);
  });

  it("always gives energy and xanax, then missed targets, then days when few", () => {
    assert.equal(kickReason({ stats, missed: [], days_in_faction: 400 }), "Failing to meet faction standards - avgE7(120), avgE30(422), xanDaily(1.2)");
    assert.equal(
      kickReason({ stats, missed: [{ key: "crimes_7", label: "crimes7", value: 4 }, { key: "gym_7", label: "gym 7", value: null, shown: "1.2k" }], days_in_faction: 45 }),
      "Failing to meet faction standards - avgE7(120), avgE30(422), xanDaily(1.2), crimes7(4), gym7(1.2k), days(45)",
    );
  });

  it("stays within Torn's 200 characters, dropping missed targets before anything else", () => {
    const missed = Array.from({ length: 30 }, (_, n) => ({ key: `stat_${n}`, label: `someLongStat${n}`, value: 1000 + n }));
    const reason = kickReason({ stats, missed, days_in_faction: 10 });
    assert.ok(reason.length <= REASON_LIMIT, `${reason.length} characters`);
    assert.match(reason, /^Failing to meet faction standards - avgE7\(120\), avgE30\(422\), xanDaily\(1\.2\), someLongStat0\(1000\)/);
    assert.match(reason, /days\(10\)$/);
  });

  it("words avgE7's change against avgE30", () => {
    assert.deepEqual([changeText(-23), changeText(8), changeText(0), changeText(null)], ["↓ 23%", "↑ 8%", "± 0%", ""]);
  });
});
