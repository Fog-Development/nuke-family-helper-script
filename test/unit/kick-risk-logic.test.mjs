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

describe("leave risk and last online", async () => {
  const { awayTier, daysSince, deltaText, lastOnlineText, reasonsText } = await import("../../src/features/kick-risk/logic.js");
  const now = Date.parse("2026-11-26T12:00:00Z");

  it("counts whole days since Torn's last action (UTC)", () => {
    assert.equal(daysSince("2026-11-26T03:00:00Z", now), 0);
    assert.equal(daysSince("2026-11-25T11:59:00Z", now), 1);
    assert.equal(daysSince("2026-11-16T12:00:00Z", now), 10);
    assert.equal(daysSince(null, now), null);
    assert.equal(daysSince("nonsense", now), null);
    assert.equal(daysSince("2026-11-27T00:00:00Z", now), 0, "a clock a little ahead is not negative");
    assert.deepEqual([0, 1, 6, null].map(lastOnlineText), ["today", "1 day ago", "6 days ago", "unknown"]);
  });

  it("chips members away three days or more, louder from a week", () => {
    assert.deepEqual([null, 0, 2, 3, 6, 7, 30].map(awayTier), [null, null, null, "away", "away", "gone", "gone"]);
  });

  it("names the model's reasons with the member's value", () => {
    assert.equal(
      reasonsText([
        { label: "Time Online / day (7d)", value: 12.5 },
        { label: "Xanax Taken / day (30d)", value: 0.24 },
        { label: "Tenure (days)", value: null },
      ]),
      "Time Online / day (7d) 13 · Xanax Taken / day (30d) 0.2 · Tenure (days)",
    );
    assert.equal(reasonsText([]), "");
    assert.equal(reasonsText(undefined), "");
  });

  it("says which way the risk moved since last week", () => {
    assert.deepEqual([12.5, -3, 0, null, undefined, "x"].map(deltaText), ["↑ 12.5 since last week", "↓ 3 since last week", "no change since last week", "", "", ""]);
  });
});
