// Every page contract (test/page-contracts.json) must hold on the fixtures it
// lists, and every listed fixture must exist. The recorder extension checks the
// same contracts on the live page, so a contract that holds here and breaks
// there means Torn changed its markup: refresh the fixture, then fix the feature.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import { fixtureMeta, fixtureUrl, launch, loadPageFixture } from "../harness/torn.js";

const { contracts } = JSON.parse(readFileSync(new URL("../page-contracts.json", import.meta.url), "utf8"));

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

describe("page contracts", () => {
  it("have unique ids and valid regexes", () => {
    const ids = contracts.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const c of contracts) assert.doesNotThrow(() => new RegExp(c.url), c.id);
  });

  for (const contract of contracts) {
    for (const id of contract.fixtures || []) {
      it(`${contract.id} holds on ${id}`, async () => {
        const meta = fixtureMeta(id);
        assert.match(fixtureUrl(id), new RegExp(contract.url), `${id}'s URL is not one the contract applies to`);
        const page = await browser.newPage();
        try {
          await page.route("**/*", (route) => route.abort());
          await page.setContent(loadPageFixture(id), { waitUntil: "domcontentloaded" });
          if (contract.when) {
            assert.ok(await page.$(contract.when), `${id} (${meta.title}) lacks the contract's "when" ${contract.when}`);
          }
          for (const e of contract.expect) {
            const count = await page.locator(e.selector).count();
            assert.ok(count >= (e.min ?? 1), `${e.selector}: found ${count} on ${id}`);
          }
        } finally {
          await page.close();
        }
      });
    }
  }
});
