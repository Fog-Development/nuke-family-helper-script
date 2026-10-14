import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

const BOX = ".nfh-active-contract";
const SETTING = ".nfh-contract-setting";
const NOTE = `${SETTING} + .nfh-setting-note`;

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// A contract covering the captured profile's player (1234).
const coverage = {
  coverage: [
    {
      player_ids: [1234],
      contract: {
        rule_revive_chance_percentage: 0,
        rule_player_status: "ANY",
        rule_is_online: true,
        rule_is_away: false,
        rule_is_offline: false,
        is_premium: true,
        contract_start_date: "2026-10-04 08:00:08",
        contract_end_date: null,
        note: "Request only",
      },
    },
  ],
};

function openProfile({ theme = "dark", reviving, localStorage = {} } = {}) {
  return openTornPage(browser, {
    page: "profiles",
    theme,
    localStorage,
    api: {
      "GET /contracts/active-coverage": coverage,
      "GET /user/get-own-roles": { role: "member", in_reviving_faction: reviving },
    },
  });
}

async function openSettings(page) {
  await page.waitForSelector(".nfh-settings-cog");
  await page.click(".nfh-settings-cog");
  await page.waitForSelector(`${SETTING} input`, { state: "visible" });
}

describe("active contract box setting", () => {
  for (const theme of THEMES) {
    it(`is locked on in a reviving faction (${theme})`, async () => {
      const { page, errors, close } = await openProfile({ theme, reviving: true });
      try {
        await page.waitForSelector(BOX);
        await openSettings(page);
        const box = page.locator(`${SETTING} input`);
        assert.equal(await box.isChecked(), true);
        assert.equal(await box.isDisabled(), true);
        assert.match(await page.locator(SETTING).getAttribute("title"), /Your faction revives/);
        assert.equal(await page.locator(NOTE).isVisible(), true);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(".nfh-settings-panel"), `contract-setting-locked-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("is off outside a reviving faction, and turning it on shows the box", async () => {
    const { page, errors, close } = await openProfile({ reviving: false });
    try {
      await openSettings(page);
      // The member's faction arrives in the background on the first load.
      await page.waitForFunction((sel) => !document.querySelector(sel).checked, `${SETTING} input`);
      assert.equal(await page.locator(BOX).count(), 0);
      const box = page.locator(`${SETTING} input`);
      assert.equal(await box.isDisabled(), false);
      assert.equal(await page.locator(NOTE).isVisible(), false);

      await box.check();
      await page.waitForSelector(BOX);
      assert.equal(await page.evaluate(() => localStorage.getItem("nfhShowActiveContract")), "true");

      await box.uncheck();
      await page.waitForSelector(BOX, { state: "detached" });
      assert.deepEqual(errors, []);
      await screenshot(page.locator(".nfh-settings-panel"), "contract-setting-off-dark");
    } finally {
      await close();
    }
  });

  it("hides the box straight away when the faction is already known", async () => {
    const { page, close } = await openProfile({
      reviving: false,
      localStorage: { nfhUserRole: { role: "member", reviving: false, timestamp: Date.now() } },
    });
    try {
      await page.waitForSelector(".nfh-shitlist-profile");
      await page.waitForTimeout(300);
      assert.equal(await page.locator(BOX).count(), 0);
    } finally {
      await close();
    }
  });

  it("shows the box while the faction is not known yet", async () => {
    const { page, close } = await openProfile({ reviving: undefined });
    try {
      await page.waitForSelector(BOX);
    } finally {
      await close();
    }
  });
});

describe("script headers", () => {
  it("tells nuke.family the version, client and manager on each call", async () => {
    const { page, apiCalls, close } = await openProfile({ reviving: true });
    try {
      await page.waitForSelector(BOX);
      const call = apiCalls.find((c) => c.path === "/contracts/active-coverage");
      assert.equal(call.headers["X-NFH-Version"], "test");
      assert.equal(call.headers["X-NFH-Client"], "browser");
      assert.equal(call.headers["X-NFH-Manager"], "Tampermonkey");
      assert.equal(call.headers["X-NFH-Feature"], undefined);
      for (const value of Object.values(call.headers)) assert.equal(typeof value, "string");
    } finally {
      await close();
    }
  });

  it("reports calls that got no answer on the next one that does", async () => {
    const { page, apiCalls, close } = await openProfile({
      reviving: true,
      localStorage: { nfhUnansweredCalls: "3" },
    });
    try {
      await page.waitForSelector(BOX);
      const reported = apiCalls.filter((c) => c.headers["X-NFH-Failures"]);
      assert.equal(reported.length, 1);
      assert.equal(reported[0].headers["X-NFH-Failures"], "3");
      assert.equal(await page.evaluate(() => localStorage.getItem("nfhUnansweredCalls")), null);
    } finally {
      await close();
    }
  });
});
