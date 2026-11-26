import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyProgress,
  badgeParts,
  badgeTitle,
  bulkPageKind,
  isFinished,
  playerIdFromHref,
  progressText,
  scoreText,
  scoreTier,
  unscoredIds,
} from "../../src/features/recruiting-scores/logic.js";

const score = { composite: 62.4, activity: 70, kick_safety: 81.5, retention: 33.9, combat: null, feature_set: "public" };

describe("recruiting score badges", () => {
  it("uses the profile check's traffic light", () => {
    assert.deepEqual([null, undefined, "", "x", 0, 33.9, 34, 66.9, 67, 100].map(scoreTier), [null, null, null, null, "low", "low", "mid", "mid", "good", "good"]);
    assert.deepEqual([62.4, 0, null].map(scoreText), ["62", "0", "—"]);
  });

  it("shows the composite and every sub-score, kick safety highlighted", () => {
    const parts = badgeParts(score);
    assert.deepEqual(parts.composite, { text: "62", tier: "mid" });
    assert.deepEqual(
      parts.subs.map((sub) => [sub.short, sub.text, sub.tier, !!sub.highlight]),
      [
        ["A", "70", "good", false],
        ["KS", "82", "good", true],
        ["R", "34", "low", false],
        ["C", "—", null, false],
      ],
    );
    assert.equal(badgeTitle(score), "Recruiting score 62/100 · Activity 70 · Kick safety 82 · Retention 34 · Combat — (public model). Click for the reasons.");
    assert.match(badgeTitle({ ...score, feature_set: "full" }), /\(full model\)/);
  });
});

describe("Score this page", () => {
  it("is offered on the lists recruiters browse, and nowhere else", () => {
    const kinds = [
      "https://www.torn.com/page.php?sid=hof",
      "https://www.torn.com/bringafriend.php",
      "https://www.torn.com/page.php?sid=UserList&levelFrom=10",
      "https://www.torn.com/factions.php?step=profile&ID=123#/",
      "https://www.torn.com/index.php?page=people&cityID=12",
      "https://www.torn.com/factions.php?step=your#/tab=controls&option=members",
      "https://www.torn.com/page.php?sid=stocks",
      "https://www.torn.com/profiles.php?XID=1",
      "https://example.com/page.php?sid=hof",
      "not a url",
    ].map(bulkPageKind);
    assert.deepEqual(kinds, ["halloffame", null, "search", "faction-profile", "abroad", null, null, null, null, null], "not Recruit Citizens");
  });

  it("reads player ids from profile links", () => {
    assert.equal(playerIdFromHref("/profiles.php?XID=2001"), 2001);
    assert.equal(playerIdFromHref("https://www.torn.com/profiles.php?foo=1&XID=42#/"), 42);
    assert.equal(playerIdFromHref("/factions.php?step=profile&ID=5"), null);
    assert.equal(playerIdFromHref(null), null);
  });

  it("asks only for players not answered yet, failed ones again", () => {
    const results = new Map([
      [1, { state: "scored" }],
      [2, { state: "failed" }],
    ]);
    assert.deepEqual(unscoredIds([1, 2, 3, 3, 4], results), [2, 3, 4]);
  });

  it("folds each poll into what is known and moves the cursor to the newest result", () => {
    const results = new Map();
    let cursor = applyProgress(results, { results: [{ player_id: 7, seq: 1, state: "scored" }] }, 0);
    assert.equal(cursor, 1);
    cursor = applyProgress(results, { results: [{ player_id: 9, seq: 3, state: "failed" }, { player_id: 8, seq: 2, state: "scored" }] }, cursor);
    assert.equal(cursor, 3);
    assert.equal(applyProgress(results, { results: [] }, cursor), 3, "an empty poll keeps the cursor");
    assert.deepEqual([...results.keys()], [7, 9, 8]);
  });

  it("says how far a lookup got", () => {
    const results = new Map([
      [1, { state: "scored" }],
      [2, { state: "failed" }],
    ]);
    assert.equal(progressText({ status: "running", done: 2, total: 5 }, results), "Scoring 2 of 5…");
    assert.equal(progressText({ status: "completed", done: 2, total: 2 }, results), "Scored 1 of 2 (1 couldn't be read).");
    assert.equal(progressText({ status: "completed", done: 1, total: 1 }, new Map([[1, { state: "scored" }]])), "Scored 1 player.");
    assert.equal(progressText({ status: "failed", done: 1, total: 5 }, results), "Stopped after 1 of 5.");
    assert.deepEqual(["queued", "running", "completed", "failed"].map(isFinished), [false, false, true, true]);
  });
});
