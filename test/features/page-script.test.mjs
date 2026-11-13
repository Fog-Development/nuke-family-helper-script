import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { pageNonce, runInPage } from "../../src/core/page-script.js";
import { launch } from "../harness/torn.js";

// Torn's pages send a Content-Security-Policy that only runs inline scripts
// carrying the page's nonce. Scripts the userscript adds to the page (the mail
// editor bridge, the Loan request, the retal feed tap) must copy that nonce.

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

const PAGE = "https://www.torn.com/messages.php";
const CSP = "script-src 'nonce-abc123' 'self'";

async function openStrictPage() {
  const page = await browser.newPage();
  await page.route("**/*", (route) =>
    route.fulfill({
      contentType: "text/html",
      headers: { "Content-Security-Policy": CSP },
      body: `<!DOCTYPE html><html><head><script nonce="abc123">window.tornRan = true;</script></head><body></body></html>`,
    }),
  );
  await page.goto(PAGE);
  return page;
}

// The helper as the bundle has it, run where the userscript runs (evaluate
// is not subject to the page's CSP, just as a userscript isn't).
const helper = `let nonce; ${pageNonce.toString()} ${runInPage.toString()}`;

describe("scripts added to Torn's page", () => {
  it("run under Torn's CSP by carrying its nonce", async () => {
    const page = await openStrictPage();
    try {
      assert.equal(await page.evaluate(() => window.tornRan), true);
      await page.evaluate(`${helper}; runInPage("document.documentElement.setAttribute('data-ran', '1')")`);
      assert.equal(await page.getAttribute("html", "data-ran"), "1");
    } finally {
      await page.close();
    }
  });

  it("would be blocked without it (what Torn's console showed)", async () => {
    const page = await openStrictPage();
    try {
      await page.evaluate(() => {
        const tag = document.createElement("script");
        tag.textContent = "document.documentElement.setAttribute('data-ran', '1')";
        document.head.appendChild(tag);
      });
      assert.equal(await page.getAttribute("html", "data-ran"), null);
    } finally {
      await page.close();
    }
  });
});
