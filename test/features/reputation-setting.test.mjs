import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

const BOX = ".nfh-reputation";
const SETTING = ".nfh-reputation-setting";
const NOTE = `${SETTING} + .nfh-setting-note`;

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

function openProfile({ theme = "dark", reviving, permissions = [], localStorage = {} } = {}) {
  return openTornPage(browser, {
    page: "profiles",
    theme,
    localStorage,
    api: {
      "GET /user/get-own-roles": { role: "member", in_reviving_faction: reviving },
      "GET /user/get-own-permissions": { permissions },
    },
  });
}

async function openSettings(page) {
  await page.waitForSelector(".nfh-settings-cog");
  await page.click(".nfh-settings-cog");
  await page.waitForSelector(`${SETTING} input`, { state: "visible" });
}

describe("reputation box setting", () => {
  for (const theme of THEMES) {
    it(`is locked on for a member who can check recruiting scores (${theme})`, async () => {
      const { page, errors, close } = await openProfile({
        theme,
        reviving: false,
        permissions: ["recruiting.predict"],
        localStorage: { nfhShowReputation: "false" },
      });
      try {
        await page.waitForSelector(`${BOX} .nfh-recruiting-btn`);
        await openSettings(page);
        const box = page.locator(`${SETTING} input`);
        assert.equal(await box.isChecked(), true);
        assert.equal(await box.isDisabled(), true);
        assert.match(await page.locator(SETTING).getAttribute("title"), /recruiting scores/);
        assert.equal(await page.locator(NOTE).isVisible(), true);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(".nfh-settings-panel"), `reputation-setting-locked-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("is off by default outside a reviving faction, and turning it on shows the box", async () => {
    const { page, errors, close } = await openProfile({ reviving: false });
    try {
      await openSettings(page);
      // The member's faction arrives in the background on the first load.
      await page.waitForFunction((sel) => !document.querySelector(sel).checked, `${SETTING} input`);
      await page.waitForSelector(BOX, { state: "detached" });
      const box = page.locator(`${SETTING} input`);
      assert.equal(await box.isDisabled(), false);
      assert.equal(await page.locator(NOTE).isVisible(), false);

      await box.check();
      await page.waitForSelector(BOX);
      assert.equal(await page.evaluate(() => localStorage.getItem("nfhShowReputation")), "true");

      await box.uncheck();
      await page.waitForSelector(BOX, { state: "detached" });
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("keeps a non-reviver's own choice to show it", async () => {
    const { page, close } = await openProfile({
      reviving: false,
      localStorage: {
        nfhShowReputation: "true",
        nfhUserRole: { role: "member", reviving: false, timestamp: Date.now() },
      },
    });
    try {
      await page.waitForSelector(BOX);
    } finally {
      await close();
    }
  });

  it("shows by default in a reviving faction and can be turned off", async () => {
    const { page, close } = await openProfile({ reviving: true });
    try {
      await page.waitForSelector(BOX);
      await openSettings(page);
      const box = page.locator(`${SETTING} input`);
      assert.equal(await box.isChecked(), true);
      assert.equal(await box.isDisabled(), false);
      await box.uncheck();
      await page.waitForSelector(BOX, { state: "detached" });
    } finally {
      await close();
    }
  });
});
