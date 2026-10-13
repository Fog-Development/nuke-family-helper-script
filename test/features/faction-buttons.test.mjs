import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

describe("faction controls buttons", () => {
  for (const theme of THEMES) {
    it(`are injected once on the controls tab (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, {
        page: "factions-controls",
        theme,
      });
      try {
        await page.waitForSelector("#nfh-change-key-btn");
        assert.equal(await page.locator("#nfh-change-key-btn").count(), 1);
        assert.equal(await page.locator("#nfh-check-updates-btn").count(), 1);
        assert.equal(await page.locator("#nfh-debug-info-btn").count(), 1);
        assert.deepEqual(errors, []);
        await screenshot(
          page.locator("#nfh-change-key-btn").locator(".."),
          `faction-buttons-${theme}`,
        );
      } finally {
        await close();
      }
    });
  }

  for (const theme of THEMES) {
    it(`show a debug report the member can copy, without their key (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, {
        page: "factions-controls",
        theme,
        api: { "GET /oc/config": respond(403, { error: "Your faction is not part of the Nuke Family." }) },
      });
      try {
        await page.locator("#nfh-debug-info-btn").click();
        const text = await page.locator("#nfh-debug-dialog textarea").inputValue();
        const report = JSON.parse(text);

        assert.ok(report.script.version);
        assert.equal(report.key.stored, true);
        assert.equal(report.key.accepted, true);
        assert.equal(report.site_now["/user/get-own-roles"].status, 200);
        assert.deepEqual(report.site_now["/oc/config"], {
          status: 403,
          error: "Your faction is not part of the Nuke Family.",
        });
        assert.equal(report.site_now["/oc/board"].present, true);
        assert.ok("nfhOcConfig" in report.stored.stores);
        // The key itself is never in the report.
        const token = await page.evaluate(() => GM_getValue("apiToken", ""));
        assert.ok(token.length > 0);
        assert.ok(!text.includes(token));

        assert.deepEqual(errors, []);
        await screenshot(page.locator(".nfh-debug-dialog"), `debug-info-${theme}`);

        await page.locator("[data-nfh-debug-close]").click();
        assert.equal(await page.locator("#nfh-debug-dialog").count(), 0);
      } finally {
        await close();
      }
    });
  }

  it("are repaired after Torn rebuilds the panel", async () => {
    const { page, close } = await openTornPage(browser, { page: "factions-controls" });
    try {
      await page.waitForSelector("#nfh-change-key-btn");
      await page.evaluate(() => {
        document.querySelector("#nfh-change-key-btn").remove();
        document.querySelector("#nfh-check-updates-btn").remove();
        document.querySelector("#nfh-debug-info-btn").remove();
        // The dispatcher re-runs init on navigation.
        history.pushState({}, "", location.pathname + location.search + "#/tab=controls&x=1");
      });
      await page.waitForSelector("#nfh-change-key-btn");
      assert.equal(await page.locator("#nfh-change-key-btn").count(), 1);
    } finally {
      await close();
    }
  });
});
