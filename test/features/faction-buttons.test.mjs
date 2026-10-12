import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, screenshot } from "../harness/torn.js";
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

  it("are repaired after Torn rebuilds the panel", async () => {
    const { page, close } = await openTornPage(browser, { page: "factions-controls" });
    try {
      await page.waitForSelector("#nfh-change-key-btn");
      await page.evaluate(() => {
        document.querySelector("#nfh-change-key-btn").remove();
        document.querySelector("#nfh-check-updates-btn").remove();
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
