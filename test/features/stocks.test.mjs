import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, loadPageFixture, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// Stock signals on Torn's stock market. The lots are made from the capture's
// own blocks (read from its HTML) so nothing about real holdings is written here.

const BAR = "#nfh-stock-bar";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// The open stock in the capture and its blocks, as Torn lists them.
function capturedBlocks() {
  const html = loadPageFixture("stocks-expanded", 1);
  const panel = html.indexOf('id="panel-ownedTab"');
  const stockId = Number([...html.slice(0, panel).matchAll(/<ul id="(\d+)" class="stock___/g)].pop()[1]);
  const end = html.indexOf('<ul id="', panel);
  const blocks = [...html.slice(panel, end).matchAll(/class="shares___[^"]*">([\d,]+)<\/li>.*?class="bought___[^"]*">\$([\d.,]+)<\/li>/gs)].map((match) => ({
    shares: Number(match[1].replace(/,/g, "")),
    price: Number(match[2].replace(/,/g, "")),
  }));
  return { stockId, blocks };
}

function site({ stockId, blocks }, { faction = false } = {}) {
  const portfolios = [
    { bucket: "personal", summary: "SELL AAA · BUY CCC $1.0m (3/5 slots after this)", slots: 5, free_cash: 1_000_000, stocks: { [stockId]: { acronym: "AAA", action: "SELL", note: "+2.1% over normal" }, 1: { acronym: "TSB", action: "BUY", buy_shares: 855, buy_amount: 1_000_000 } } },
  ];
  if (faction) portfolios.push({ bucket: "faction", summary: "Nothing to do right now (2/4 slots after this)", slots: 4, free_cash: 0, stocks: { [stockId]: { acronym: "AAA", action: "HOLD", note: "" } } });
  const lots = blocks.map((block, n) => ({
    id: n + 1,
    torn_transaction_id: 1000 + n,
    stock_id: stockId,
    shares: block.shares,
    price: block.price,
    bucket: n === 1 ? "faction" : "personal",
    category: n === 2 ? "Benefit block" : n === 1 ? "Faction · trading" : "Trading",
    trading: n !== 2,
    faction_id: n === 1 ? 5678 : null,
    signal: n === 0 ? "SELL" : n === 1 ? "HOLD" : null,
    sell_at: n === 1 ? 1012.5 : null,
  }));
  return { "GET /stocks/signals": { tracker_url: "https://nuke.family/stocks", portfolios, lots } };
}

describe("stock signals on the stock market", () => {
  for (const theme of THEMES) {
    it(`summarises each portfolio and tags the stocks a signal applies to (${theme})`, async () => {
      const captured = capturedBlocks();
      const { page, errors, close } = await openTornPage(browser, { page: "stocks", theme, api: site(captured) });
      try {
        await page.waitForSelector(BAR);
        assert.match(await page.locator(BAR).innerText(), /Personal: SELL AAA · BUY CCC \$1\.0m/);
        assert.equal(await page.locator(`${BAR} a[href="https://nuke.family/stocks"]`).count(), 1);
        assert.equal(await page.locator(`ul[id="${captured.stockId}"] .nfh-st-tag--sell`).innerText(), "SELL");
        assert.equal(await page.locator('ul[id="1"] .nfh-st-tag--buy').innerText(), "BUY");
        const { ratio } = await measureContrast(page, `ul[id="${captured.stockId}"] .nfh-st-tag--sell`);
        assert.ok(ratio >= 4.5, `tag contrast ${ratio.toFixed(2)} in ${theme}`);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(BAR), `stocks-bar-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("says what to do in a stock's panel and marks each block", async () => {
    const captured = capturedBlocks();
    assert.ok(captured.blocks.length >= 3, "the capture's open stock has several blocks");
    const { page, errors, close } = await openTornPage(browser, { page: "stocks-expanded", step: 1, api: site(captured, { faction: true }) });
    try {
      await page.waitForSelector("#panel-ownedTab .nfh-st-lot");
      const advice = await page.locator("#panel-ownedTab .nfh-st-advice").innerText();
      assert.match(advice, /Personal: Sell the blocks marked SELL/);
      assert.match(advice, /Faction: Hold/);
      const labels = await page.locator('#panel-ownedTab .nfh-st-lotline .nfh-st-lot').allInnerTexts();
      assert.deepEqual(labels.slice(0, 3), ["Personal · SELL", "Faction · Hold → $1012.50", "Personal · Benefit block"]);
      assert.equal(await page.locator('#panel-ownedTab ul.nfh-st-row--sell').count(), 1);
      assert.deepEqual(errors, []);
      await screenshot(page.locator("#panel-ownedTab"), "stocks-panel");
    } finally {
      await close();
    }
  });

  it("stays quiet for a member who doesn't use the tracker", async () => {
    const { page, close } = await openTornPage(browser, { page: "stocks", api: { "GET /stocks/signals": () => respond(403, { message: "no" }) } });
    try {
      await page.waitForTimeout(1200);
      assert.equal(await page.locator(BAR).count(), 0);
      assert.equal(await page.locator(".nfh-st-tag").count(), 0);
    } finally {
      await close();
    }
  });

  it("fits TornPDA's width", async () => {
    const captured = capturedBlocks();
    const { page, close } = await openTornPage(browser, { page: "stocks", api: site(captured), viewport: { width: 412, height: 900 } });
    try {
      await page.waitForSelector(BAR);
      const overflow = await page.evaluate((bar) => document.querySelector(bar).scrollWidth - document.querySelector(bar).clientWidth, BAR);
      assert.ok(overflow <= 0, `bar overflows by ${overflow}px`);
    } finally {
      await close();
    }
  });
});
