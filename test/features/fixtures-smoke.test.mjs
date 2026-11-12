// Every captured page (every recorded step of it), in both themes, with the
// script injected: it must load without errors or unexpected dialogs.
// Screenshots go to test/screenshots/ (smoke-<fixture>[-step-N]-<theme>.png) so
// new or changed UI can be eyeballed on every page it might appear on, not only
// the one a feature targets.
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, listFixtures, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

describe("page fixtures smoke test", () => {
  for (const meta of listFixtures()) {
    for (const { n } of meta.steps) {
      const label = n ? `${meta.id}-step-${n}` : meta.id;
      for (const theme of THEMES) {
        it(`${label} (${theme})`, async () => {
          const { page, errors, dialogs, close } = await openTornPage(browser, {
            page: meta.id,
            step: n,
            theme,
          });
          try {
            await page.waitForTimeout(1500); // let async injection and API calls settle
            assert.deepEqual(errors, []);
            assert.deepEqual(dialogs, []);
            await screenshot(page, `smoke-${label}-${theme}`);
          } finally {
            await close();
          }
        });
      }
    }
  }
});
