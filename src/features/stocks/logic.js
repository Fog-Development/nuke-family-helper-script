// Stock signals on Torn's stock market: the pure rules (no DOM), unit tested.

export const BUCKET_LABELS = { personal: "Personal", faction: "Faction" };

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(n >= 1e10 ? 0 : 1)}b`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m`;
  if (n >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${Math.round(n)}`;
};
export { money };

export const shares = (n) => Number(n || 0).toLocaleString("en-US");

// "1,400,000" / "$774.39" from Torn's cells.
export function parseNumber(text) {
  const n = Number(String(text || "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

// Each portfolio's signal for one stock: [{ bucket, action, buy_shares, buy_amount, note }].
export function signalsFor(data, stockId) {
  const out = [];
  for (const portfolio of data?.portfolios || []) {
    const row = portfolio.stocks?.[stockId] ?? portfolio.stocks?.[String(stockId)];
    if (row && row.action) out.push({ bucket: portfolio.bucket, ...row });
  }
  return out;
}

// Which tag a stock row gets: SELL and BUY loudly, HOLD quietly, WATCH not at all.
export function rowTags(signals) {
  return signals
    .filter((signal) => ["BUY", "SELL", "HOLD"].includes(signal.action))
    .map((signal) => ({ bucket: signal.bucket, action: signal.action, loud: signal.action !== "HOLD" }));
}

// Match Torn's transaction rows (in the order Torn lists them) to the
// member's lots of that stock, by shares and buy price. Each lot is used once.
// rows: [{ shares, price }] → lots (or null) in the same order.
export function matchTransactions(rows, lots) {
  const left = [...(lots || [])];
  return rows.map((row) => {
    const index = left.findIndex((lot) => Number(lot.shares) === row.shares && Math.abs(Number(lot.price) - row.price) < 0.015);
    return index === -1 ? null : left.splice(index, 1)[0];
  });
}

// The words on a transaction row for its lot.
export function lotLabel(lot, multiplePortfolios) {
  if (!lot) return null;
  const owner = multiplePortfolios || lot.bucket === "faction" ? `${BUCKET_LABELS[lot.bucket] || lot.bucket} · ` : "";
  if (!lot.trading) return { kind: "other", text: `${owner}${lot.category}` };
  if (lot.signal === "SELL") return { kind: "sell", text: `${owner}SELL` };
  if (lot.signal === "HOLD") return { kind: "hold", text: `${owner}Hold → $${Number(lot.sell_at).toFixed(2)}` };
  return { kind: "other", text: `${owner}${lot.category}` };
}
