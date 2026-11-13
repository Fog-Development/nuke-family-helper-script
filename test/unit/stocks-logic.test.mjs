import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lotLabel, matchTransactions, money, parseNumber, rowTags, signalsFor } from "../../src/features/stocks/logic.js";

describe("stock signal logic", () => {
  it("matches Torn's blocks to lots by shares and price, each lot once", () => {
    const lots = [
      { id: 1, shares: 700000, price: 753.87 },
      { id: 2, shares: 700000, price: 753.87 },
      { id: 3, shares: 350000, price: 753.96 },
    ];
    const rows = [{ shares: 700000, price: 753.87 }, { shares: 1400000, price: 774.39 }, { shares: 700000, price: 753.87 }, { shares: 350000, price: 753.96 }];
    assert.deepEqual(matchTransactions(rows, lots).map((lot) => lot?.id ?? null), [1, null, 2, 3]);
  });

  it("picks each portfolio's signal for a stock and tags loudly only BUY and SELL", () => {
    const data = { portfolios: [{ bucket: "personal", stocks: { 29: { action: "SELL" } } }, { bucket: "faction", stocks: { 29: { action: "HOLD" }, 3: { action: "WATCH" } } }] };
    assert.deepEqual(rowTags(signalsFor(data, 29)), [
      { bucket: "personal", action: "SELL", loud: true },
      { bucket: "faction", action: "HOLD", loud: false },
    ]);
    assert.deepEqual(rowTags(signalsFor(data, 3)), []);
  });

  it("labels a block by its signal or kind", () => {
    assert.deepEqual(lotLabel({ trading: true, signal: "SELL", bucket: "personal" }, false), { kind: "sell", text: "SELL" });
    assert.deepEqual(lotLabel({ trading: true, signal: "HOLD", sell_at: 1012.5, bucket: "faction" }, false), { kind: "hold", text: "Faction · Hold → $1012.50" });
    assert.deepEqual(lotLabel({ trading: false, category: "Benefit block", bucket: "personal" }, true), { kind: "other", text: "Personal · Benefit block" });
    assert.equal(lotLabel(null, false), null);
  });

  it("reads and writes money", () => {
    assert.equal(parseNumber("$1,187,536,000"), 1187536000);
    assert.deepEqual([money(1_000_000), money(25_000_000), money(2_500_000_000), money(4200)], ["$1.0m", "$25m", "$2.5b", "$4k"]);
  });
});
