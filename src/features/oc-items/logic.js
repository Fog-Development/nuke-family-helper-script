// Required OC items: the pure rules (no DOM), unit tested.
//
// The site sends what each member's open crime needs, which items count as OC
// items, and the OC items on loan as Torn's armoury list had them (Torn keeps
// that list up to an hour). The armoury tabs open on the page are live, so for
// those tabs the page's rows replace the site's loans.

export const TAB_LABELS = {
  weapons: "Weapons",
  armour: "Armour",
  temporary: "Temporary",
  medical: "Medical",
  drugs: "Drugs",
  boosters: "Boosters",
  consumables: "Consumables",
  utilities: "Utilities",
};

export const tabLabel = (tab) => TAB_LABELS[tab] || "Utilities";

export const armouryHash = (tab) => `#/tab=armoury&start=0&sub=${tab}`;

// The armoury sub-tab in a URL hash, or null.
export function tabInHash(hash) {
  const match = String(hash || "").match(/tab=armoury.*?sub=(\w+)/);
  return match ? match[1] : null;
}

// Loans to use: the site's, except for tabs read live from the page, whose
// rows replace them. `live` is { tab: [{ itemId, loanedTo, loanedName, ... }] }.
export function currentLoans(siteLoans, live) {
  const liveTabs = new Set(Object.keys(live || {}));
  const loans = (siteLoans || []).filter((loan) => !liveTabs.has(loan.tab));
  for (const [tab, rows] of Object.entries(live || {})) {
    for (const row of rows) {
      if (!row.loanedTo) continue;
      loans.push({ item_id: row.itemId, item_name: row.name, tab, player_id: row.loanedTo, player_name: row.loanedName || "", live: true });
    }
  }
  return loans;
}

// OC items on loan to someone whose open crime doesn't need them (or who is in
// no crime at all). `needs` is { playerId: [itemId, ...] }.
export function unusedLoans(loans, needs, ocItemIds) {
  const oc = new Set((ocItemIds || []).map(Number));
  const seen = new Set();
  const out = [];
  for (const loan of loans || []) {
    const itemId = Number(loan.item_id);
    if (!oc.has(itemId)) continue;
    const needed = (needs && needs[loan.player_id]) || null;
    if (needed && needed.map(Number).includes(itemId)) continue;
    const key = `${loan.player_id}:${itemId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...loan, reason: needed ? "their crime doesn't need it" : "not in a crime" });
  }
  return out.sort((a, b) => String(a.player_name).localeCompare(String(b.player_name)) || String(a.item_name).localeCompare(String(b.item_name)));
}

// Missing items still missing: a loan made from this page counts as done.
export function stillMissing(missing, loanedNow) {
  return (missing || []).filter((entry) => !loanedNow.has(`${entry.player_id}:${entry.item_id}`));
}

// The members who need an item, by item id.
export function needersByItem(missing) {
  const byItem = new Map();
  for (const entry of missing || []) {
    if (!byItem.has(entry.item_id)) byItem.set(entry.item_id, []);
    byItem.get(entry.item_id).push(entry);
  }
  return byItem;
}

// A copy the armoury can lend now: a row on the item's tab nobody holds, with
// Torn's own loan option. Plain weapons before ones with bonuses.
export function availableCopy(rows, itemId) {
  const free = (rows || []).filter((row) => row.itemId === Number(itemId) && !row.loanedTo && row.canLoan);
  return free.find((row) => !row.hasBonus) || free[0] || null;
}

// Torn's answer to a loan, read loosely: its armoury actions answer JSON with
// `success` (and a message), or a bit of HTML text.
export function readLoanAnswer(text) {
  const raw = String(text || "");
  try {
    const json = JSON.parse(raw);
    if (json && typeof json === "object") {
      const message = stripTags(json.message || json.msg || json.text || "");
      const ok = json.success === true || json.success === "true" || (json.success === undefined && /success/i.test(raw) && !json.error);
      return { ok, message: message || (json.error ? stripTags(String(json.error)) : "") };
    }
  } catch (error) {
    // not JSON
  }
  const message = stripTags(raw).slice(0, 200);
  return { ok: /success|you loaned|loaned .* to/i.test(raw) && !/error|not allowed|cannot|can't/i.test(raw), message };
}

function stripTags(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
