import { api } from "../../core/api.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import {
  classify,
  comparatorFor,
  formatStats,
  parseStatText,
  pickEstimate,
  SortMode,
  Source,
  SOURCES,
} from "./logic.js";
import { getPrefs, setPrefs } from "./prefs.js";

// Ranked war board: on a ranked war view (your own faction's, or any other
// faction's from its page), every member's status cell says when they leave
// hospital or where they are flying, and each side's list can be kept sorted
// by who can be hit next or by battle stat estimate.
//
// The statuses come from nuke.family (`/war/board`), which reads them from
// Torn once for everyone looking and knows whether the faction is at war at
// all; this script never calls Torn's API and needs no Torn key of its own.
//
// Stat estimates are BSP's or FF Scouter's. A member who runs either has them
// on the page already: they are read from there, used for sorting, and passed
// on to nuke.family (once a day per player is enough), which hands them to the
// members who run neither.
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

// BSP's coloured box beside a name; FF Scouter's estimate on the row itself.
const BSP_BOX_SELECTOR = ".iconStats, .iconStatsAttack";
// FF Scouter marks a list it is filtering or sorting itself; it is left alone.
const FF_BUSY_SELECTOR = "[data-ffscouter-active-filter]";

const DEFAULT_POLL_MS = 5000;
const ERROR_RETRY_MS = 30 * 1000;
// Estimates barely move during a war; asking again now and then picks up
// what other members' scripts have passed on since.
const STATS_REFRESH_MS = 10 * 60 * 1000;
// Estimates read off the page are sent in one request, this long after the
// last new one turned up (BSP and FF Scouter fill the list in bit by bit).
const UPLOAD_DELAY_MS = 4000;
const UPLOAD_RETRY_MS = 5 * 60 * 1000;
const UPLOAD_MAX = 300;
// Statuses older than this are no longer shown as if they were current.
const STALE_MS = 60 * 1000;

const state = {
  target: null, // whose war is open: "" for your own faction's, else a faction id
  war: undefined, // undefined = not asked yet, null = the site knows of no war
  members: {},
  held: { bsp: {}, ffscouter: {} }, // estimates nuke.family holds, by source
  fresh: { bsp: new Set(), ffscouter: new Set() }, // players it needs nothing for
  statsAt: 0,
  anyStats: false, // some row has an estimate, from anywhere
  heldShown: false, // some row is showing one nuke.family supplied
  sources: new Set(), // the sources estimates are available from
  uploadAfter: 0,
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

// Estimates read off the page that nuke.family does not have yet.
const pending = { bsp: new Map(), ffscouter: new Map() };

let ticker = null;
let uploadTimer = null;
let barHtml = "";

// Whose ranked war the page is showing: "" for your own faction's
// (`step=your`), the faction's id on another faction's page
// (`step=profile&ID=…`), or null when this is not a ranked war view.
function viewedWar() {
  if (!window.location.hash.startsWith("#/war/rank")) return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("step") === "your") return "";
  const id = params.get("step") === "profile" && params.get("ID");
  return id && /^\d+$/.test(id) ? id : null;
}

// Forget one war's statuses and estimates before showing another's.
function watch(target) {
  if (state.target === target) return;
  state.target = target;
  state.war = undefined;
  state.members = {};
  for (const source of SOURCES) {
    state.held[source] = {};
    state.fresh[source] = new Set();
    pending[source].clear();
  }
  state.statsAt = 0;
  state.uploadAfter = 0;
  state.fetchedAt = 0;
  state.nextPollAt = 0;
  state.error = false;
  memos.clear();
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

// The estimates the member's own BSP and FF Scouter put on this row.
function pageEstimatesOf(row) {
  const found = {};
  const scouter = Number(row.dataset.estValue);
  if (scouter > 0) found[Source.FfScouter] = Math.round(scouter);
  // BSP keeps the exact figure on its box; the text ("4.3b") is the fallback.
  const box = row.querySelector(BSP_BOX_SELECTOR);
  const predicted = box && (Math.round(Number(box.dataset.bspStats)) || parseStatText(box.textContent));
  if (predicted > 0) found[Source.Bsp] = predicted;
  return found;
}

// Queue what the page shows and nuke.family lacks. Nothing is queued before
// the site has said what it holds, so most page views send nothing at all.
function noteForUpload(id, onPage) {
  if (state.statsAt === 0 || Date.now() < state.uploadAfter) return;
  for (const source of SOURCES) {
    if (!onPage[source] || state.fresh[source].has(id) || pending[source].has(id)) continue;
    pending[source].set(id, onPage[source]);
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(upload, UPLOAD_DELAY_MS);
  }
}

async function upload() {
  uploadTimer = null;
  const target = state.target;
  for (const source of SOURCES) {
    const batch = [...pending[source].entries()].slice(0, UPLOAD_MAX);
    if (batch.length === 0) continue;
    pending[source].clear();

    try {
      await api("/war/estimates", {
        method: "POST",
        data: {
          source,
          ...(target ? { faction_id: Number(target) } : {}),
          estimates: batch.map(([id, total]) => ({ id: Number(id), total })),
        },
      });
      if (state.target !== target) return;
      for (const [id] of batch) state.fresh[source].add(id);
      LogInfo(`War board sent ${batch.length} ${source} estimates`);
    } catch (error) {
      // Not marked as held, so they are tried again later in this page view.
      state.uploadAfter = Date.now() + UPLOAD_RETRY_MS;
      console.error("[NFH] Could not send stat estimates to nuke.family:", error);
    }
  }
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
  let anyStats = false;
  let heldShown = false;
  const sources = new Set();

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
      const onPage = pageEstimatesOf(row);
      const held = { bsp: state.held.bsp[id], ffscouter: state.held.ffscouter[id] };
      const estimate = pickEstimate(onPage, held, prefs.source);
      noteForUpload(id, onPage);
      for (const source of SOURCES) {
        if (onPage[source] || held[source]) sources.add(source);
      }
      entry.stats = estimate.total;
      // BSP and FF Scouter draw their own; ours is only for what they do not show.
      const badge = estimate.total > 0 && !estimate.fromPage;
      anyStats = anyStats || estimate.total > 0;
      heldShown = heldShown || badge;
      entry.row = row;
      entries.push(entry);

      if (statusCell) {
        setAttr(statusCell, STATUS_ATTR, entry.label);
        setAttr(statusCell, TONE_ATTR, entry.label !== null && pageKind === "travel" ? "travel" : null);
      }
      setAttr(row, ROW_ATTR, entry.out ? "out" : entry.soon ? "soon" : null);
      const memberCell = cellOf(row, "member");
      if (memberCell) {
        setAttr(memberCell, STATS_ATTR, prefs.showStats && badge ? formatStats(entry.stats) : null);
      }
    }

    if (compare && !list.closest(FF_BUSY_SELECTOR)) reorder(list, entries, compare);
  }

  state.anyStats = anyStats;
  state.heldShown = heldShown;
  state.sources = sources;
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

function statusText() {
  if (state.war === null) {
    return state.target
      ? "nuke.family found no ranked war on for this faction."
      : "nuke.family has no ranked war on for your faction yet.";
  }
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
        (state.anyStats
          ? chip(SortMode.StatsAsc, "Stats ▲", "Lowest battle stat estimate first") +
            chip(SortMode.StatsDesc, "Stats ▼", "Highest battle stat estimate first")
          : "") +
        chip(SortMode.Off, "Torn's order", "Leave the lists as Torn sorts them (or BSP / FF Scouter, if you sort with theirs)") +
        (state.sources.size > 1
          ? '<label title="Whose estimate to use when both are known">Estimates <select data-pref="source">' +
            `<option value="${Source.Bsp}"${prefs.source === Source.Bsp ? " selected" : ""}>BSP</option>` +
            `<option value="${Source.FfScouter}"${prefs.source === Source.FfScouter ? " selected" : ""}>FF Scouter</option>` +
            "</select></label>"
          : "") +
        (state.heldShown || (state.anyStats && !prefs.showStats)
          ? `<label title="Show the estimates other members' BSP or FF Scouter passed on to nuke.family, where yours shows none"><input type="checkbox" data-pref="showStats"${prefs.showStats ? " checked" : ""}> Show stats</label>`
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
  const pref = event.target.dataset.pref;
  if (pref === "showStats") {
    setPrefs({ showStats: event.target.checked });
  } else if (pref === "source") {
    setPrefs({ source: event.target.value });
  } else {
    return;
  }
  refresh();
}

function refresh() {
  const lists = document.querySelectorAll(LIST_SELECTOR);
  if (lists.length > 0) {
    decorate(lists);
    ensureBar();
  }
}

async function poll() {
  const wantStats = Date.now() - state.statsAt > STATS_REFRESH_MS;
  const target = state.target;
  const query = [target ? `faction_id=${target}` : "", wantStats ? "stats=1" : ""].filter(Boolean).join("&");
  state.loading = true;

  try {
    const response = await api("/war/board" + (query ? `?${query}` : ""));
    // The answer to a war that is no longer the one on the page is dropped.
    if (state.target !== target) return;
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
    if (data.estimates) {
      for (const source of SOURCES) {
        state.held[source] = data.estimates[source] || {};
        state.fresh[source] = new Set(((data.estimates_fresh || {})[source] || []).map(String));
      }
      state.statsAt = Date.now();
    }
  } catch (error) {
    if (state.target !== target) return;
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
  const target = viewedWar();
  if (target === null) {
    stop();
    return;
  }
  watch(target);
  // Nothing is fetched or redrawn for a tab nobody is looking at.
  if (document.hidden) return;

  const lists = document.querySelectorAll(LIST_SELECTOR);
  // Torn has not drawn the war yet (or the war is over and there are no lists).
  if (lists.length === 0) return;

  decorate(lists);
  ensureBar();

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
  clearTimeout(uploadTimer);
  uploadTimer = null;
  for (const source of SOURCES) pending[source].clear();
  LogInfo("War board stopped");
}

function init() {
  if (viewedWar() === null) {
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
