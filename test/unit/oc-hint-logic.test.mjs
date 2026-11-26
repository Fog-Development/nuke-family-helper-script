import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hintFor, idleLabel, QUIET_SECONDS } from "../../src/features/oc-hint/logic.js";

const NOW = 1_800_000_000;

describe("No OC hint", () => {
  it("shows nothing in a crime, when switched off or when the site doesn't know", () => {
    assert.equal(hintFor(null, NOW), null);
    assert.equal(hintFor({ enabled: false }, NOW), null);
    assert.equal(hintFor({ enabled: true, state: "in_oc", idle_since: null }, NOW), null);
    assert.equal(hintFor({ enabled: true, state: "unknown", idle_since: null }, NOW), null);
  });

  it("is quiet for the first hour after a crime and a warning after", () => {
    const quiet = hintFor({ enabled: true, state: "idle", idle_since: NOW - 25 * 60 }, NOW);
    assert.deepEqual([quiet.tone, quiet.text], ["quiet", "No OC · 25m"]);

    const warn = hintFor({ enabled: true, state: "idle", idle_since: NOW - QUIET_SECONDS }, NOW);
    assert.deepEqual([warn.tone, warn.text, warn.age], ["warn", "No OC · 1h", "1h"]);
    assert.match(warn.title, /crimes/);
  });

  it("names the time in whole minutes, hours, then days", () => {
    assert.equal(idleLabel(-5), "0m");
    assert.equal(idleLabel(59 * 60), "59m");
    assert.equal(idleLabel(5 * 3600 + 1800), "5h");
    assert.equal(idleLabel(47 * 3600), "47h");
    assert.equal(idleLabel(3 * 86400 + 100), "3d");
  });
});
