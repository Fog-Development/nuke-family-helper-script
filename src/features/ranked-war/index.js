import { api } from "../../core/api.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { classify, comparatorFor, formatStats, SortMode } from "./logic.js";
import { getPrefs, setPrefs } from "./prefs.js";

// Ranked war board: on your own faction's ranked war view, every member's
// status cell says when they leave hospital or where they are flying, and each
// side's list can be kept sorted by who can be hit next or by battle stat
// estimate.
//
// The statuses come from nuke.family (`/war/board`), which reads them from
// Torn once for everyone looking and knows whether the faction is at war at
// all; this script never calls Torn's API and needs no Torn key of its own.
//
// Nothing here runs unless the ranked war view is open: init() returns at once
// on any other faction tab. While it is open there is one 1s timer, which
// polls only while the tab is visible, touches a row only when what it shows
// changed, and moves rows only when the order is actually wrong.

const BAR_ID = "nfh-war-bar";
const ANCHOR_SELECTOR = "#faction_war_list_id";
const LIST_SELECTOR = "#faction_war_list_id .faction-war ul.members-list";

const STATUS_ATTR = "data-nfh-war";
const TONE_ATTR = "data-nfh-war-tone";
const ROW_ATTR = "data-nfh-war-row";
const STATS_ATTR = "data-nfh-war-stats";

const DEFAULT_POLL_MS = 5000;
const ERROR_RETRY_MS = 30 * 1000;
// Estimates barely move during a war; asking again now and then picks up a
// Torn Stats key added since.
const STATS_REFRESH_MS = 30 * 60 * 1000;
// Statuses older than this are no longer shown as if they were current.
const STALE_MS = 60 * 1000;

const state = {
  war: undefined, // undefined = not asked yet, null = the site knows of no war
  members: {},
  stats: {},
  statsAt: 0,
  fetchedAt: 0, // when statuses last arrived (browser clock)
  clockOffset: 0, // server clock minus browser clock, ms
  nextPollAt: 0,
  loading: false,
  error: false,
};

// What each player was last seen doing, so "just out of hospital" survives
// from one tick to the next.
const memos = new Map();
// The attribute values last written to each element, to skip writes that
// would change nothing.
let written = new WeakMap();

let ticker = null;
let barHtml = "";

function isRankedWarView() {
  return (
    window.location.search.includes("step=your") &&
    window.location.hash.startsWith("#/war/rank")
  );
}

function setAttr(element, name, value) {
  let cache = written.get(element);
  if (!cache) {
    cache = {};
    written.set(element, cache);
  }
  if (cache[name] === value) return;
  cache[name] = value;
  if (value === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value);
  }
}

function playerIdOf(row) {
  const link = row.querySelector("a[href*='profiles.php?XID=']");
  const match = link && link.getAttribute("href").match(/XID=(\d+)/);
  return match ? match[1] : null;
}

// A row's cell by name. Torn gives the cells a plain class and a build-hashed
// one ("status status___BLAOt"); either is enough.
function cellOf(row, name) {
  return row.querySelector(`.${name}`) || row.querySelector(`[class*="${name}___"]`);
}

// What Torn's own (live) status cell says, from its state class or its text.
function pageKindOf(statusCell) {
  if (!statusCell) return "other";
  const classes = statusCell.classList;
  const text = statusCell.textContent.trim();
  if (classes.contains("hospital") || classes.contains("jail") || /^(Hospital|Jail)$/.test(text)) {
    return "hospital";
  }
  if (classes.contains("traveling") || classes.contains("abroad") || /^(Traveling|Abroad)$/.test(text)) {
    return "travel";
  }
  return text === "Okay" ? "okay" : "other";
}

function clearRow(row) {
  setAttr(row, ROW_ATTR, null);
  const statusCell = cellOf(row, "status");
  if (statusCell) {
    setAttr(statusCell, STATUS_ATTR, null);
    setAttr(statusCell, TONE_ATTR, null);
  }
  const memberCell = cellOf(row, "member");
  if (memberCell) setAttr(memberCell, STATS_ATTR, null);
}

function clearAll() {
  for (const element of document.querySelectorAll(`[${STATUS_ATTR}], [${ROW_ATTR}], [${STATS_ATTR}]`)) {
    element.removeAttribute(STATUS_ATTR);
    element.removeAttribute(TONE_ATTR);
    element.removeAttribute(ROW_ATTR);
    element.removeAttribute(STATS_ATTR);
  }
  written = new WeakMap();
}

function hasData() {
  return !!state.war && Date.now() - state.fetchedAt < STALE_MS;
}

// Bring every row up to date, then put each list in order.
function decorate(lists) {
  const prefs = getPrefs();
  const live = hasData();
  const now = Date.now() + state.clockOffset;
  const compare = live ? comparatorFor(prefs.sort) : null;

  for (const list of lists) {
    const entries = [];

    for (const row of list.children) {
      const id = playerIdOf(row);
      if (!id || !live) {
        clearRow(row);
        continue;
      }

      const statusCell = cellOf(row, "status");
      const pageKind = pageKindOf(statusCell);
      const entry = classify(state.members[id], pageKind, now, memos.get(id));
      memos.set(id, entry.memo);
      entry.stats = state.stats[id] || 0;
      entry.row = row;
      entries.push(entry);

      if (statusCell) {
        setAttr(statusCell, STATUS_ATTR, entry.label);
        setAttr(statusCell, TONE_ATTR, entry.label !== null && pageKind === "travel" ? "travel" : null);
      }
      setAttr(row, ROW_ATTR, entry.out ? "out" : entry.soon ? "soon" : null);
      const memberCell = cellOf(row, "member");
      if (memberCell) {
        setAttr(memberCell, STATS_ATTR, prefs.showStats && entry.stats ? formatStats(entry.stats) : null);
      }
    }

    if (compare) reorder(list, entries, compare);
  }
}

// Array.prototype.sort is stable, so rows that tie keep the order Torn gave
// them and nothing moves without a reason.
function reorder(list, entries, compare) {
  const sorted = [...entries].sort(compare);
  if (sorted.every((entry, index) => entry === entries[index])) return;

  const fragment = document.createDocumentFragment();
  for (const entry of sorted) fragment.appendChild(entry.row);
  list.insertBefore(fragment, list.firstChild);
}

function hasStats() {
  return Object.keys(state.stats).length > 0;
}

function statusText() {
  if (state.war === null) return "nuke.family has no ranked war on for your faction yet.";
  if (state.error && !hasData()) return "Could not reach nuke.family. Trying again shortly.";
  if (!hasData()) return "Loading statuses…";
  const age = Math.round((Date.now() - state.fetchedAt) / 1000);
  return age < 15 ? "Live" : `Updated ${age}s ago`;
}

function renderBar() {
  const prefs = getPrefs();
  const chip = (mode, label, title) =>
    `<button type="button" class="nfh-cw-chip${prefs.sort === mode ? " is-armed" : ""}" data-sort="${mode}" title="${title}">${label}</button>`;

  return (
    '<div class="nfh-cw-bar">' +
    "<strong>War board</strong>" +
    (state.war
      ? '<span class="nfh-cw-muted">Sort</span>' +
        chip(SortMode.Status, "Hospital", "Who can be hit now, then who leaves hospital next") +
        (hasStats()
          ? chip(SortMode.StatsAsc, "Stats ▲", "Lowest battle stat estimate first") +
            chip(SortMode.StatsDesc, "Stats ▼", "Highest battle stat estimate first")
          : "") +
        chip(SortMode.Off, "Torn's order", "Leave the lists as Torn sorts them") +
        (hasStats()
          ? `<label title="Show each opponent's battle stat estimate, from your faction's spies on Torn Stats"><input type="checkbox" data-pref="showStats"${prefs.showStats ? " checked" : ""}> Show stats</label>`
          : "")
      : "") +
    `<span class="nfh-cw-status nfh-cw-muted">${statusText()}</span>` +
    "</div>"
  );
}

function ensureBar() {
  let bar = document.getElementById(BAR_ID);
  if (!bar) {
    const anchor = document.querySelector(ANCHOR_SELECTOR);
    if (!anchor) return;
    bar = document.createElement("div");
    bar.id = BAR_ID;
    bar.className = "nfh-cw nfh-war-bar";
    bar.addEventListener("click", onClick);
    bar.addEventListener("change", onChange);
    anchor.insertAdjacentElement("beforebegin", bar);
    barHtml = "";
  }

  const html = renderBar();
  if (html !== barHtml) {
    barHtml = html;
    bar.innerHTML = html;
  }
}

function onClick(event) {
  const button = event.target.closest("[data-sort]");
  if (!button) return;
  setPrefs({ sort: button.dataset.sort });
  refresh();
}

function onChange(event) {
  if (event.target.dataset.pref !== "showStats") return;
  setPrefs({ showStats: event.target.checked });
  refresh();
}

function refresh() {
  const lists = document.querySelectorAll(LIST_SELECTOR);
  if (lists.length > 0) {
    ensureBar();
    decorate(lists);
  }
}

async function poll() {
  const wantStats = Date.now() - state.statsAt > STATS_REFRESH_MS;
  state.loading = true;

  try {
    const response = await api("/war/board" + (wantStats ? "?stats=1" : ""));
    const data = response.data || {};
    state.error = false;

    if (!data.war) {
      state.war = null;
      state.nextPollAt = Date.now() + (data.recheck_seconds || 600) * 1000;
      return;
    }

    state.war = data.war;
    state.members = data.members || {};
    state.fetchedAt = Date.now();
    state.clockOffset = data.server_time * 1000 - Date.now();
    state.nextPollAt = Date.now() + (data.poll_seconds * 1000 || DEFAULT_POLL_MS);
    if (data.stats) {
      state.stats = data.stats;
      state.statsAt = Date.now();
    }
  } catch (error) {
    // The last statuses stay up until they go stale; the bar says so.
    state.error = true;
    state.nextPollAt = Date.now() + ERROR_RETRY_MS;
    console.error("[NFH] Could not load the war board from nuke.family:", error);
  } finally {
    state.loading = false;
    refresh();
  }
}

function tick() {
  if (!isRankedWarView()) {
    stop();
    return;
  }
  // Nothing is fetched or redrawn for a tab nobody is looking at.
  if (document.hidden) return;

  const lists = document.querySelectorAll(LIST_SELECTOR);
  // Torn has not drawn the war yet (or the war is over and there are no lists).
  if (lists.length === 0) return;

  ensureBar();
  decorate(lists);

  if (!state.loading && Date.now() >= state.nextPollAt) {
    poll();
  }
}

function stop() {
  clearInterval(ticker);
  ticker = null;
  const bar = document.getElementById(BAR_ID);
  if (bar) bar.remove();
  clearAll();
  memos.clear();
  LogInfo("War board stopped");
}

function init() {
  if (!isRankedWarView()) {
    if (ticker) stop();
    return;
  }
  if (ticker) return;

  ticker = setInterval(tick, 1000);
  tick();
  LogInfo("War board started");
}

export default {
  name: "ranked-war",
  pages: [PageType.Faction],
  init,
};
