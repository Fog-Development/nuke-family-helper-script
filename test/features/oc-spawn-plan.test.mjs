import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

// The spawn plan for OC staff beside Torn's spawn buttons on the Recruiting
// sub-tab. The site is stubbed; the plan is made up here.

const PANEL = "#nfh-oc-spawn";

const staffBoard = {
  data: {
    synced_at: 1900000000,
    crimes: [],
    me: { player_id: 1, level: 8, cprs: {} },
    members: { 100124: { name: "Member100124", level: 8 } },
  },
};

const plan = {
  data: {
    enabled: true,
    generated_at: 1900000000,
    horizon_hours: 24,
    idle_without_slot: 1,
    tiers: [
      {
        tier: "psi", label: "Psi", levels: [7, 8], scope_cost: 4, spawn: 1, seeking: 2, back_later: 2, waiting: 1, open_slots_taken: 1,
        below_productive: false, per_crime: 3.5,
        reasons: [
          "4 level 7-8 members: 4 free within 24h (crimes ending 20:00 TCT)",
          "2 usually take long enough to rejoin that they're back after the 24h, so are counted as half",
          "1 open slot already fits them",
        ],
        members: [],
      },
      {
        tier: "phi", label: "Phi", levels: [5, 6], scope_cost: 3, spawn: 0, seeking: 2, back_later: 0, waiting: 0, open_slots_taken: 2,
        below_productive: true, per_crime: 2.8, reasons: ["2 level 5-6 members: 2 in no crime now", "2 open slots already fit them"], members: [],
      },
    ],
    stall_risks: [{ crime_id: 9, crime_name: "Bidding War", level: 6, open_slots: 1, stalled: true, roles: ["Driver"] }],
    grading: { suggestions: 9, followed: 0.67, waiting_when_followed: 0.3, waiting_when_not: 1.8 },
  },
};

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

const badges = (page) =>
  page.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('button[class*="spawnDifficulty___"]')].map((button) => [
        button.getAttribute("aria-label").split(",")[0],
        button.querySelector(".nfh-oc-spawn-badge")?.textContent ?? null,
      ]),
    ),
  );

describe("OC spawn plan", () => {
  for (const theme of THEMES) {
    it(`staff see what to spawn on Torn's buttons and why under the spawner (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, {
        page: "factions-crimes-recruiting",
        theme,
        api: { "GET /oc/board": staffBoard, "GET /oc/spawn-plan": plan },
      });
      try {
        await page.waitForSelector(PANEL);
        assert.deepEqual(await badges(page), { Lambda: null, Sigma: null, Phi: "✓", Psi: "+1", Omega: null });
        assert.ok(
          await page.$eval(PANEL, (panel) => panel.previousElementSibling.className.includes("manualSpawnerContainer")),
          "the plan sits right under the spawner",
        );
        const text = await page.$eval(PANEL, (panel) => panel.textContent);
        assert.match(text, /Spawn 1/);
        assert.match(text, /4 scope/);
        assert.match(text, /crimes ending 20:00 TCT/);
        assert.match(text, /Bidding War/);
        assert.match(text, /1 member is in no crime with nothing open/);
        await screenshot(await page.$(PANEL), `oc-spawn-plan-${theme}`);
        await screenshot(await page.$('[class*="manualSpawnerContainer"]'), `oc-spawn-buttons-${theme}`);
        assert.deepEqual(errors, []);
      } finally {
        await close();
      }
    });
  }

  it("members who aren't OC staff get nothing and the plan is never asked for", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "factions-crimes-recruiting",
      api: { "GET /oc/spawn-plan": plan },
    });
    try {
      await page.waitForTimeout(1500);
      assert.equal(await page.$(PANEL), null);
      assert.ok(!apiCalls.some((call) => call.path === "/oc/spawn-plan"));
    } finally {
      await close();
    }
  });
});
