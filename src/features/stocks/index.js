import { api, ApiError } from "../../core/api.js";
import { escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { BUCKET_LABELS, lotLabel, matchTransactions, money, parseNumber, rowTags, shares, signalsFor } from "./logic.js";

// The member's stock tracker on Torn's stock market (`/stocks/signals` on
// nuke.family, the member's own data; nothing shows for someone who doesn't
// use the tracker).
//
// - A line above the market with each portfolio's summary (what to sell and
//   buy) and a link to the tracker.
// - Each stock row a signal applies to gets a tag: BUY and SELL loud, Hold
//   quiet, each named Personal or Faction when both portfolios have signals.
// - A stock's own holdings panel says how much to buy, and marks each block
//   in Torn's list: SELL, Hold until a price, or what kind of block it is
//   (benefit block, faction money). Blocks are matched by shares and price.
//
// It only reads the page; buying and selling stay Torn's own buttons. The
// site is asked at most once every two minutes; Torn re-drawing the market
// (opening a stock) only re-reads the page.

const ROOT = "#stockmarketroot";
const BAR_ID = "nfh-stock-bar";
const CACHE_KEY = "nfhStockSignals";
const DENIED_KEY = "nfhStockSignalsDenied";
const CACHE_MS = 2 * 60 * 1000;
const DENIED_MS = 12 * 60 * 60 * 1000;

const state = { data: null, loading: null };
let observer = null;
let observedRoot = null;
let timer = null;

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // only the cache is lost
  }
}

async function load() {
  if (state.data) return state.data;
  if (state.loading) return state.loading;
  const denied = readJson(DENIED_KEY);
  if (denied && Date.now() - denied < DENIED_MS) return null;
  const cached = readJson(CACHE_KEY);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    state.data = cached.data;
    return state.data;
  }
  state.loading = api("/stocks/signals")
    .then((data) => {
      state.data = data;
      writeJson(CACHE_KEY, { at: Date.now(), data });
      return data;
    })
    .catch((error) => {
      if (error instanceof ApiError && error.status === 403) writeJson(DENIED_KEY, Date.now());
      LogInfo("[stocks]", error);
      return null;
    })
    .finally(() => {
      state.loading = null;
      schedule(0);
    });
  return state.loading;
}

const both = () => (state.data?.portfolios || []).length > 1;
const hasAnything = () => (state.data?.portfolios || []).length > 0 || (state.data?.lots || []).length > 0;

function renderBar(root) {
  let bar = document.getElementById(BAR_ID);
  if (!hasAnything()) {
    bar?.remove();
    return;
  }
  const market = root.querySelector('[class*="stockMarket___"]');
  if (!market) return;
  if (!bar) {
    bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.className = "nfh-cw nfh-st-bar";
    market.parentElement.insertBefore(bar, market);
  }
  const lines = (state.data.portfolios || []).map(
    (portfolio) => `<div><strong>${escapeHtml(BUCKET_LABELS[portfolio.bucket] || portfolio.bucket)}:</strong> ${escapeHtml(portfolio.summary)}</div>`,
  );
  if (!lines.length) lines.push(`<div class="nfh-cw-muted">Signals are off: your blocks are labelled, but nothing says buy or sell.</div>`);
  const html = `<div class="nfh-st-lines">${lines.join("")}</div>
    <a class="nfh-cw-btn" href="${escapeHtml(state.data.tracker_url)}" target="_blank" rel="noopener">Stock tracker ↗</a>`;
  if (bar.innerHTML !== html) bar.innerHTML = html;
}

function tagRows(root) {
  for (const row of root.querySelectorAll('ul[id][class*="stock___"]')) {
    const stockId = Number(row.id);
    const tags = rowTags(signalsFor(state.data, stockId));
    const host = row.querySelector('[class*="nameContainer___"]') || row.querySelector('[class*="stockName___"]');
    if (!host) continue;
    let element = host.querySelector(".nfh-st-tags");
    if (!tags.length) {
      element?.remove();
      continue;
    }
    const html = tags
      .map((tag) => `<span class="nfh-st-tag nfh-st-tag--${tag.action.toLowerCase()}">${both() || tag.bucket === "faction" ? `${escapeHtml(BUCKET_LABELS[tag.bucket])} ` : ""}${tag.action === "HOLD" ? "Hold" : tag.action}</span>`)
      .join("");
    if (!element) {
      element = document.createElement("span");
      element.className = "nfh-st-tags";
      host.appendChild(element);
    }
    if (element.innerHTML !== html) element.innerHTML = html;
  }
}

function decoratePanel(root) {
  const panel = root.querySelector("#panel-ownedTab");
  if (!panel) return;
  const stockRow = panel.previousElementSibling?.matches('ul[id][class*="stock___"]') ? panel.previousElementSibling : panel.closest("[id]")?.previousElementSibling;
  const stockId = Number(stockRow?.id || panel.parentElement?.querySelector('ul[id][class*="stock___"]')?.id);
  if (!stockId) return;

  const signals = signalsFor(state.data, stockId);
  const lots = (state.data.lots || []).filter((lot) => lot.stock_id === stockId);

  // What to do, above Torn's list of blocks.
  const lines = [];
  for (const signal of signals) {
    const who = both() || signal.bucket === "faction" ? `${BUCKET_LABELS[signal.bucket]}: ` : "";
    if (signal.action === "BUY") lines.push(`<div class="nfh-st-buy">${escapeHtml(who)}<strong>Buy ~${escapeHtml(shares(signal.buy_shares))} shares</strong> (${escapeHtml(money(signal.buy_amount))}).</div>`);
    else if (signal.action === "SELL") lines.push(`<div class="nfh-st-sell">${escapeHtml(who)}<strong>Sell the blocks marked SELL</strong>${signal.note ? ` <span class="nfh-cw-muted">${escapeHtml(signal.note)}</span>` : ""}</div>`);
    else if (signal.action === "HOLD") lines.push(`<div>${escapeHtml(who)}Hold${signal.note ? ` <span class="nfh-cw-muted">${escapeHtml(signal.note)}</span>` : ""}</div>`);
    else if (signal.note) lines.push(`<div class="nfh-cw-muted">${escapeHtml(who)}${escapeHtml(signal.note)}</div>`);
  }
  const anchor = panel.querySelector('[class*="transactionsContainer___"]') || panel.querySelector('[class*="manageTab___"]');
  let box = panel.querySelector(".nfh-st-advice");
  if (lines.length && anchor) {
    if (!box) {
      box = document.createElement("div");
      box.className = "nfh-cw nfh-st-advice";
      anchor.parentElement.insertBefore(box, anchor);
    }
    const html = lines.join("");
    if (box.innerHTML !== html) box.innerHTML = html;
  } else {
    box?.remove();
  }

  // Each block in Torn's list.
  const rows = [...panel.querySelectorAll('ul[class*="transaction___"]')];
  const read = rows.map((row) => ({
    shares: parseNumber(row.querySelector('[class*="shares___"]')?.textContent),
    price: parseNumber(row.querySelector('[class*="bought___"]')?.textContent),
  }));
  const matched = matchTransactions(read, lots);
  // The label goes on a slim line under the block: Torn's columns are fixed
  // widths with no room for it.
  rows.forEach((row, index) => {
    const label = lotLabel(matched[index], both());
    const next = row.nextElementSibling;
    let line = next?.classList.contains("nfh-st-lotline") ? next : null;
    row.classList.toggle("nfh-st-row--sell", label?.kind === "sell");
    if (!label) {
      line?.remove();
      return;
    }
    if (!line) {
      line = document.createElement("div");
      line.className = "nfh-st-lotline";
      line.innerHTML = '<span class="nfh-st-lot"></span>';
      row.after(line);
    }
    const tag = line.firstElementChild;
    const className = `nfh-st-lot nfh-st-lot--${label.kind}`;
    if (tag.className !== className) tag.className = className;
    if (tag.textContent !== label.text) tag.textContent = label.text;
  });
}

function redraw() {
  const root = document.querySelector(ROOT);
  if (!root || !state.data) return;
  renderBar(root);
  tagRows(root);
  decoratePanel(root);
}

function schedule(delay = 200) {
  clearTimeout(timer);
  timer = setTimeout(redraw, delay);
}

function watch(root) {
  if (observedRoot === root) return;
  observer?.disconnect();
  observedRoot = root;
  observer = new MutationObserver((records) => {
    const ours = records.every((record) =>
      [...record.addedNodes, ...record.removedNodes].every((node) => node.nodeType !== 1 || /(^|\s)nfh-/.test(node.className || "") || node.id === BAR_ID),
    );
    if (!ours) schedule();
  });
  observer.observe(root, { childList: true, subtree: true });
}

export default {
  name: "Stock signals",
  pages: [PageType.Stocks],
  init() {
    if (!/[?&]sid=stocks\b/.test(location.search)) return;
    let tries = 20;
    const attach = () => {
      const root = document.querySelector(ROOT);
      if (root && root.querySelector('[class*="stockMarket___"]')) {
        watch(root);
        load().then(() => schedule(0));
        return;
      }
      if (--tries > 0) setTimeout(attach, 400);
    };
    attach();
  },
};
