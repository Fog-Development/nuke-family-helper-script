import { api, ApiError } from "../../core/api.js";
import { escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { getOwnPermissions, RECRUITING_PERMISSION } from "../../core/user.js";
import { applyProgress, bulkPageKind, isFinished, progressText, unscoredIds } from "./logic.js";
import { clearAll, contentRoot, playerEntries, setDetail, upsertSlot } from "./view.js";

// "Score this page": recruiting score badges for a list of players a recruiter
// is looking at (Recruit Citizens, Hall of Fame, the player search, another
// faction's members, people abroad), for whoever may see recruiting scores.
//
// Never automatic: nothing is asked for until the member presses the button.
// The press sends the player ids on the page to nuke.family, which answers the
// players it scored in the last few hours at once and works through the rest
// on its own (reading Torn's API on the opted-in key pool, at a pace it sets).
// The script asks every two seconds, while the tab is visible, for whatever
// finished since it last asked, and draws each badge as it arrives.
//
// These lookups are kept apart from the site's logged checks, so a page scored
// here never enters the weekly snapshots or the model's training data.
// Only the page being viewed is read; nothing is requested from Torn.

const POLL_MS = 2000;
const MAX_PLAYERS = 100;

const state = {
  allowed: null,
  results: new Map(), // player id -> result (kept while the page is open, across its own list changes)
  pending: new Set(), // asked for, not answered yet
  lookup: null, // { id, status, total, done }
  cursor: 0,
  starting: false,
  error: null,
  open: new Set(),
};

let pollTimer = null;
let redrawTimer = null;
let observer = null;
let observed = null;

const kind = () => bulkPageKind(location.href);

// ---- the button bar -----------------------------------------------------------

function barHtml(entries) {
  const ids = entries.map((entry) => entry.id);
  const todo = unscoredIds(ids, state.results).filter((id) => !state.pending.has(id));
  const running = state.lookup && !isFinished(state.lookup.status);
  const scoredHere = ids.filter((id) => state.results.get(id)?.state === "scored").length;
  let label;
  if (!scoredHere && !state.pending.size) label = `Score this page (${Math.min(todo.length, MAX_PLAYERS)})`;
  else label = `Score ${Math.min(todo.length, MAX_PLAYERS)} more`;
  const button =
    todo.length && !running
      ? `<button type="button" class="nfh-cw-btn nfh-cw-btn--primary" data-rs-bar="score"${state.starting ? " disabled" : ""}>${escapeHtml(label)}</button>`
      : "";
  const status = state.error
    ? `<span class="nfh-cw-error">${escapeHtml(state.error)}</span>`
    : `<span class="nfh-cw-muted">${escapeHtml(state.lookup ? progressText(state.lookup, state.results) : `${ids.length} players on this page. Click a badge for its reasons.`)}</span>`;
  return `<span class="nfh-cw-heading"><strong>Recruiting scores</strong></span>${button}<span class="nfh-rs-bar-status">${status}</span>`;
}

function renderBar(container, entries) {
  let bar = document.getElementById("nfh-rs-bar");
  if (!entries.length && !state.lookup) {
    bar?.remove();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "nfh-rs-bar";
    bar.className = "nfh-cw nfh-rs-bar";
    bar.addEventListener("click", (event) => {
      if (event.target.closest('[data-rs-bar="score"]')) {
        event.preventDefault();
        start();
      }
    });
  }
  // Under the page's title when it has one, else at the top of the content.
  const title = container.querySelector(":scope > .content-title");
  if (title) {
    if (title.nextElementSibling !== bar) title.insertAdjacentElement("afterend", bar);
  } else if (container.firstElementChild !== bar) {
    container.prepend(bar);
  }
  const html = `<div class="nfh-cw-bar">${barHtml(entries)}</div>`;
  if (bar.innerHTML !== html) bar.innerHTML = html;
}

// ---- scoring --------------------------------------------------------------------

async function start() {
  if (state.starting || (state.lookup && !isFinished(state.lookup.status))) return;
  const ids = unscoredIds(
    playerEntries(contentRoot()).map((entry) => entry.id),
    state.results,
  ).slice(0, MAX_PLAYERS);
  if (!ids.length) return;
  state.starting = true;
  state.error = null;
  schedule(0);
  try {
    const answer = await api("/candidate-score/bulk", { method: "POST", data: { player_ids: ids, page: kind() } });
    ids.forEach((id) => {
      state.results.delete(id);
      state.pending.add(id);
    });
    track(answer, 0);
  } catch (error) {
    LogInfo("[recruiting-scores] bulk", error);
    state.error = errorText(error);
  } finally {
    state.starting = false;
    schedule(0);
  }
}

function errorText(error) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "You don't have permission to use recruiting scores.";
    if (error.status === 429 || error.status === 422) return error.body?.error || error.body?.message || "nuke.family turned that down.";
    if (error.body?.error) return error.body.error;
  }
  return "Couldn't reach nuke.family. Try again in a moment.";
}

function track(answer, cursor) {
  state.lookup = { id: answer.id, status: answer.status, total: answer.total, done: answer.done };
  state.cursor = applyProgress(state.results, answer, cursor);
  for (const result of answer.results || []) state.pending.delete(result.player_id);
  if (isFinished(answer.status)) {
    state.pending.clear();
    return;
  }
  clearTimeout(pollTimer);
  pollTimer = setTimeout(poll, POLL_MS);
}

async function poll() {
  pollTimer = null;
  const lookup = state.lookup;
  if (!lookup || isFinished(lookup.status) || !kind()) return;
  // Only while the member can see the page; picked up again when they come back.
  if (document.visibilityState !== "visible") return;
  try {
    const answer = await api(`/candidate-score/bulk/${lookup.id}?after=${state.cursor}`);
    if (state.lookup?.id !== lookup.id) return;
    track(answer, state.cursor);
    state.error = null;
  } catch (error) {
    LogInfo("[recruiting-scores] poll", error);
    if (error instanceof ApiError && error.status === 404) {
      state.lookup = null;
      state.pending.clear();
    } else {
      state.error = "Lost touch with nuke.family; still trying.";
      pollTimer = setTimeout(poll, POLL_MS * 3);
    }
  }
  schedule(0);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !pollTimer && state.lookup && !isFinished(state.lookup.status) && kind()) poll();
});

// ---- the list ---------------------------------------------------------------------

function slotState(id) {
  const result = state.results.get(id);
  if (result?.state === "scored") return { kind: "score", data: result };
  if (result?.state === "failed") return { kind: "note", text: "?", title: result.error || "Couldn't be scored." };
  if (state.pending.has(id)) return { kind: "busy" };
  return null;
}

function onAction(id, action) {
  if (action !== "toggle") return;
  state.open.has(id) ? state.open.delete(id) : state.open.add(id);
  schedule(0);
}

function redraw() {
  const container = contentRoot();
  if (!kind() || !container || state.allowed !== true) return;
  observe(container);
  const entries = playerEntries(container);
  renderBar(container, entries);
  for (const entry of entries) {
    upsertSlot(entry, slotState(entry.id), onAction);
    const result = state.results.get(entry.id);
    setDetail(entry, state.open.has(entry.id) && result?.state === "scored" ? result : null, (id) => {
      state.open.delete(id);
      schedule(0);
    });
  }
}

function schedule(delay = 250) {
  clearTimeout(redrawTimer);
  redrawTimer = setTimeout(redraw, delay);
}

// Torn loads and pages these lists in place: redraw when the list changes
// (never for our own badges).
function observe(container) {
  if (observed === container) return;
  observer?.disconnect();
  observed = container;
  observer = new MutationObserver((records) => {
    const ours = records.every((record) =>
      [...record.addedNodes, ...record.removedNodes].every(
        (node) => node.nodeType !== 1 || node.closest?.(".nfh-rs-slot, .nfh-rs-detail, #nfh-rs-bar") || /(^|\s)nfh-rs/.test(node.className || "") || node.id === "nfh-rs-bar",
      ),
    );
    if (!ours) schedule();
  });
  observer.observe(container, { childList: true, subtree: true });
}

export default {
  name: "Recruiting scores: score this page",
  pages: [PageType.RecruitCitizens, PageType.HallOfFame, PageType.Search, PageType.Faction, PageType.Abroad],
  async init() {
    if (!kind()) {
      observer?.disconnect();
      observed = null;
      document.getElementById("nfh-rs-bar")?.remove();
      return;
    }
    if (state.allowed === null) {
      const permissions = await getOwnPermissions();
      state.allowed = permissions.includes(RECRUITING_PERMISSION);
    }
    if (!state.allowed) {
      clearAll();
      return;
    }
    let tries = 12;
    const attach = () => {
      redraw();
      if (--tries > 0 && kind()) setTimeout(attach, 500);
    };
    attach();
  },
};
