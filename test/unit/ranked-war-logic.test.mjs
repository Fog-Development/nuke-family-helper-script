import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classify,
  comparatorFor,
  formatCountdown,
  formatStats,
  Group,
  parseRoute,
  parseStatText,
  pickEstimate,
  SortMode,
  Then,
} from "../../src/features/ranked-war/logic.js";

const NOW = 1_800_000_000_000;
const nowSeconds = NOW / 1000;
const hospital = (secondsLeft) => ({ s: "Hospital", u: nowSeconds + secondsLeft, d: "In hospital" });
const okay = { s: "Okay", u: 0, d: "" };

describe("ranked war: what a row shows", () => {
  it("counts a hospital stay down and flags one about to end", () => {
    const long = classify(hospital(3725), "hospital", NOW);
    assert.equal(long.group, Group.Hospital);
    assert.equal(long.label, "1:02:05");
    assert.equal(long.soon, false);

    const short = classify(hospital(185), "hospital", NOW);
    assert.equal(short.label, "3:05");
    assert.equal(short.soon, true);
  });

  it("treats someone the page shows okay as out, before the API agrees", () => {
    const out = classify(hospital(600), "okay", NOW);
    assert.equal(out.group, Group.Out);
    assert.equal(out.out, true);
    assert.equal(out.label, null);

    // Still out, no longer highlighted, 11 seconds on.
    const later = classify(hospital(589), "okay", NOW + 11000, out.memo);
    assert.equal(later.group, Group.Out);
    assert.equal(later.out, false);
    assert.equal(later.memo.outSince, NOW);

    // The API catches up: plain okay, remembered as out since then.
    const settled = classify(okay, "okay", NOW + 20000, later.memo);
    assert.equal(settled.group, Group.Okay);
    assert.equal(settled.memo.okaySince, NOW);
  });

  it("does not call a stay that just ran out an early exit", () => {
    const done = classify(hospital(1), "okay", NOW);
    assert.equal(done.group, Group.Okay);
    assert.equal(done.out, false);
    assert.equal(done.memo.okaySince, (nowSeconds + 1) * 1000);
  });

  it("believes the page when it knows of a hospital stay first", () => {
    const fresh = classify(okay, "hospital", NOW);
    assert.equal(fresh.group, Group.Hospital);
    assert.equal(fresh.label, null);
    assert.equal(fresh.until, 0);
  });

  it("says where travellers are and which way they are flying", () => {
    const at = (d) => classify({ s: d.startsWith("In ") ? "Abroad" : "Traveling", u: 0, d }, "travel", NOW);

    assert.deepEqual([at("In Mexico").group, at("In Mexico").label], [Group.Abroad, "MX"]);
    assert.deepEqual([at("Traveling to Japan").group, at("Traveling to Japan").label], [Group.Outgoing, "► JP"]);
    assert.deepEqual(
      [at("Returning to Torn from South Africa").group, at("Returning to Torn from South Africa").label],
      [Group.Incoming, "◄ SA"],
    );
    assert.equal(at("Traveling from Torn to Atlantis").label, "► Atlantis");
    assert.equal(at("Traveling").group, Group.Traveling);
    assert.equal(classify({ s: "Traveling", u: 0, d: "Traveling to Japan" }, "okay", NOW).group, Group.Out);
  });

  it("leaves a row the site knows nothing about to the page", () => {
    assert.equal(classify(undefined, "okay", NOW).group, Group.Okay);
    assert.equal(classify(undefined, "hospital", NOW).group, Group.Hospital);
    assert.equal(classify({ s: "Federal", u: 0, d: "In federal jail" }, "other", NOW).group, Group.Away);
  });

  it("parses routes and formats numbers", () => {
    assert.deepEqual(parseRoute("Traveling from Mexico to Torn"), { from: "MX", to: "TC" });
    assert.equal(parseRoute("In hospital for 3 mins"), null);
    assert.equal(formatCountdown(59), "0:59");
    assert.equal(formatCountdown(-5), "0:00");
    assert.equal(formatStats(2_500_000_000), "2.5b");
    assert.equal(formatStats(123_456_789), "123m");
    assert.equal(formatStats(1_250_000_000_000), "1.3t");
    assert.equal(formatStats(950), "950");
  });
});

describe("ranked war: stat estimates", () => {
  it("reads the short form BSP and FF Scouter write", () => {
    assert.equal(parseStatText("4.3b"), 4_300_000_000);
    assert.equal(parseStatText(" 371m "), 371_000_000);
    assert.equal(parseStatText("328k"), 328_000);
    assert.equal(parseStatText("1.25T"), 1_250_000_000_000);
    assert.equal(parseStatText("12,500"), 12_500);
    assert.equal(parseStatText("N/A"), null);
    assert.equal(parseStatText(""), null);
    assert.equal(parseStatText("0"), null);
  });

  it("prefers the member's own script, then the chosen source", () => {
    const pick = (onPage, held, preferred = "bsp") => pickEstimate(onPage, held, preferred);

    assert.deepEqual(pick({ bsp: 5, ffscouter: 7 }, { bsp: 9 }), { total: 5, source: "bsp", fromPage: true });
    assert.deepEqual(pick({ bsp: 5, ffscouter: 7 }, {}, "ffscouter"), { total: 7, source: "ffscouter", fromPage: true });
    assert.deepEqual(pick({ ffscouter: 7 }, { bsp: 9 }), { total: 7, source: "ffscouter", fromPage: true });
    assert.deepEqual(pick({}, { bsp: 9, ffscouter: 8 }, "ffscouter"), { total: 8, source: "ffscouter", fromPage: false });
    assert.deepEqual(pick({}, { ffscouter: 8 }), { total: 8, source: "ffscouter", fromPage: false });
    assert.deepEqual(pick({}, {}), { total: 0, source: null, fromPage: false });
  });
});

describe("ranked war: sorting", () => {
  const row = (name, member, pageKind, extra = {}) => ({
    name,
    ...classify(member, pageKind, NOW, extra.memo),
    stats: extra.stats || 0,
    score: extra.score || 0,
  });
  const names = (rows, mode, then) => [...rows].sort(comparatorFor(mode, then)).map((entry) => entry.name);

  const rows = [
    row("abroad", { s: "Abroad", u: 0, d: "In Mexico" }, "travel", { stats: 5e9 }),
    row("hosp-long", hospital(3000), "hospital", { stats: 1e9 }),
    row("okay-old", okay, "okay", { stats: 3e9, score: 12.5 }),
    row("hosp-unknown", okay, "hospital"),
    row("just-out", hospital(900), "okay", { stats: 9e9 }),
    row("hosp-short", hospital(60), "hospital", { stats: 2e9 }),
    row("okay-recent", okay, "okay", { memo: { okaySince: NOW - 5000 }, score: 80 }),
    row("returning", { s: "Traveling", u: 0, d: "Returning to Torn from Japan" }, "travel"),
  ];

  it("lists who can be hit now, then who leaves hospital next, then travellers", () => {
    assert.deepEqual(names(rows, SortMode.Status), [
      "just-out", "okay-recent", "okay-old", "hosp-short", "hosp-long", "hosp-unknown", "returning", "abroad",
    ]);
  });

  it("orders members with the same status by the chosen second sort", () => {
    const okays = (then) => names(rows, SortMode.Status, then).slice(1, 3);
    assert.deepEqual(okays(Then.StatsAsc), ["okay-old", "okay-recent"]);
    assert.deepEqual(okays(Then.StatsDesc), ["okay-old", "okay-recent"]);
    assert.deepEqual(okays(Then.ScoreDesc), ["okay-recent", "okay-old"]);
    assert.deepEqual(okays(Then.ScoreAsc), ["okay-old", "okay-recent"]);
    assert.deepEqual(okays(Then.Recent), ["okay-recent", "okay-old"]);
    // Status always comes first, and hospital stays go by time left.
    for (const then of Object.values(Then)) {
      const sorted = names(rows, SortMode.Status, then);
      assert.equal(sorted[0], "just-out");
      assert.deepEqual(sorted.slice(3), ["hosp-short", "hosp-long", "hosp-unknown", "returning", "abroad"]);
    }
  });

  it("sorts by stat estimate either way, with the unknown last by status", () => {
    assert.deepEqual(names(rows, SortMode.StatsAsc), [
      "hosp-long", "hosp-short", "okay-old", "abroad", "just-out", "okay-recent", "hosp-unknown", "returning",
    ]);
    assert.deepEqual(names(rows, SortMode.StatsDesc).slice(0, 5), [
      "just-out", "abroad", "okay-old", "hosp-short", "hosp-long",
    ]);
  });

  it("leaves Torn's order alone when sorting is off", () => {
    assert.equal(comparatorFor(SortMode.Off), null);
  });
});
