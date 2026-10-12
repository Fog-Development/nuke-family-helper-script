// Every captured page, in both themes, with the script injected: it must load
// without errors or unexpected dialogs. Screenshots go to test/screenshots/
// (smoke-<fixture>-<theme>.png) so new or changed UI can be eyeballed on every
// page it might appear on, not only the one a feature targets.
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { fixtureUrl, launch, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

const manifest = JSON.parse(
  readFileSync(new URL("../fixtures/pages/manifest.json", import.meta.url), "utf8"),
);

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

describe("page fixtures smoke test", () => {
  for (const name of Object.keys(manifest)) {
    for (const theme of THEMES) {
      it(`${name} (${theme})`, async () => {
        const { page, errors, dialogs, close } = await openTornPage(browser, {
          page: name,
          url: fixtureUrl(name),
          theme,
        });
        try {
          await page.waitForTimeout(1500); // let async injection and API calls settle
          assert.deepEqual(errors, []);
          assert.deepEqual(dialogs, []);
          await screenshot(page, `smoke-${name}-${theme}`);
        } finally {
          await close();
        }
      });
    }
  }
});
