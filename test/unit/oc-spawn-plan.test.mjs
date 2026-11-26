import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { spawnBadges, spawnPanelHtml } from "../../src/features/organized-crimes/spawn-plan-logic.js";

const plan = {
  enabled: true,
  horizon_hours: 24,
  idle_without_slot: 2,
  tiers: [
    {
      tier: "phi", label: "Phi", levels: [5, 6], scope_cost: 3, spawn: 0, seeking: 3, back_later: 0, below_productive: true,
      reasons: ["3 level 5-6 members: 3 in no crime now", "everyone has a slot, so no new crime is needed yet"],
    },
    {
      tier: "psi", label: "Psi", levels: [7, 8], scope_cost: 4, spawn: 2, seeking: 6, back_later: 2, open_slots_taken: 4, suits: 0.5, for_levels: [8], below_productive: false,
      reasons: ["8 level 7-8 members: 6 free within 24h (crimes ending 14:00, 19:00 TCT)", "<b>4</b> open slots already fit them"],
    },
  ],
  stall_risks: [{ crime_id: 9, crime_name: "Bidding War", level: 6, open_slots: 1, stalled: true, roles: ["Driver"] }],
  grading: { suggestions: 9, followed: 0.67, waiting_when_followed: 0.3, waiting_when_not: 1.8 },
};

describe("OC spawn plan", () => {
  it("badges a tier to spawn with how many, and one with enough open with a tick", () => {
    const badges = spawnBadges(plan);
    assert.deepEqual([badges.psi.text, badges.psi.tone], ["+2", "spawn"]);
    assert.match(badges.psi.title, /crimes ending 14:00, 19:00 TCT/);
    assert.deepEqual([badges.phi.text, badges.phi.tone], ["✓", "ok"]);
    assert.equal(badges.omega, undefined, "nobody at that level");
    assert.deepEqual(spawnBadges({ enabled: false }), {});
  });

  it("lists the highest tier first with its scope cost, the crimes to fill first and the grade", () => {
    const html = spawnPanelHtml(plan);
    assert.ok(html.indexOf("Psi") < html.indexOf("Phi"));
    assert.match(html, /Spawn 2 <span class="nfh-oc-plan__for">for L8<\/span><\/span><span class="nfh-oc-plan__muted">8 scope/);
    assert.match(html, /8 members free soon · 4 open slots fit/);
    assert.match(html, /Enough open/);
    assert.match(html, /2 members in no crime with nothing open/);
    assert.match(html, /1 started crime has open roles nobody is due to take/);
    assert.match(html, /Bidding War .*1 open role, stalled/);
    assert.match(html, /9 suggestions, 67% followed/);
    assert.match(html, /<details class="nfh-oc-plan__row" data-nfh-key="tier-psi">/);
    assert.match(html, /&lt;b&gt;4&lt;\/b&gt;/, "reasons are escaped");
    assert.equal(spawnPanelHtml({ enabled: false }), "");
  });
});
