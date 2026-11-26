import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

// The quiet "No OC" chip beside My Faction in Torn's sidebar, from /oc/me.

const CHIP = "#nfh-oc-hint";

const idleFor = (hours) => ({
  data: { enabled: true, state: "idle", idle_since: Math.floor(Date.now() / 1000) - hours * 3600, checked_at: null },
});

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

describe("No OC hint in the sidebar", () => {
  for (const theme of THEMES) {
    for (const fixture of ["factions-faction", "controls-applications-mobile"]) {
      it(`shows how long the member has been out of a crime (${fixture}, ${theme})`, async () => {
        const { page, errors, close } = await openTornPage(browser, {
          page: fixture,
          theme,
          api: { "GET /oc/me": idleFor(5) },
        });
        try {
          const chip = await page.waitForSelector(CHIP, { state: "attached" });
          assert.equal(await chip.textContent(), "No OC · 5h");
          assert.match(await chip.getAttribute("class"), /nfh-oc-hint--warn/);
          assert.equal(await chip.getAttribute("href"), "/factions.php?step=your#/tab=crimes");
          assert.ok(await page.$eval(CHIP, (el) => el.closest("#nav-faction") !== null));
          if (fixture.endsWith("-mobile")) {
            assert.ok(await page.$("#fly-out-menu-button #nfh-oc-hint-dot"), "the closed menu button gets a dot");
            // The harness doesn't run Torn's code, so slide the fly-out sidebar open by hand.
            await page.evaluate(() => {
              document.querySelector('[class*="flyOutPanel"]').style.transform = "none";
            });
            assert.equal(await page.$eval(".nfh-oc-hint__age", (el) => getComputedStyle(el).display), "none");
          }
          await screenshot(page, `oc-hint-${fixture}-${theme}`);
          assert.deepEqual(errors, []);
        } finally {
          await close();
        }
      });
    }
  }

  it("is grey for the first hour after a crime", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-faction",
      api: { "GET /oc/me": idleFor(0.25) },
    });
    try {
      const chip = await page.waitForSelector(CHIP, { state: "attached" });
      assert.equal(await chip.textContent(), "No OC · 15m");
      assert.match(await chip.getAttribute("class"), /nfh-oc-hint--quiet/);
      assert.equal(await page.$("#nfh-oc-hint-dot"), null, "no dot while it's quiet");
    } finally {
      await close();
    }
  });

  it("shows nothing in a crime, when the member hid it, or outside the family (and stops asking)", async () => {
    for (const options of [
      { api: {} },
      { api: { "GET /oc/me": idleFor(5) }, localStorage: { nfhOcHint: "off" } },
      { api: { "GET /oc/me": respond(403, { error: "Not in the family" }) } },
    ]) {
      const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "factions-faction", ...options });
      try {
        await page.waitForTimeout(1200);
        assert.equal(await page.$(CHIP), null);
        if (options.localStorage) {
          assert.ok(!apiCalls.some((call) => call.path === "/oc/me"), "a hidden hint asks nothing");
        }
        if (options.api["GET /oc/me"] && options.api["GET /oc/me"].__response) {
          const cached = await page.evaluate(() => JSON.parse(localStorage.getItem("nfhOcMe")));
          assert.equal(cached.refused, true);
        }
        assert.deepEqual(errors.filter((e) => !e.includes("403")), []);
      } finally {
        await close();
      }
    }
  });
});
