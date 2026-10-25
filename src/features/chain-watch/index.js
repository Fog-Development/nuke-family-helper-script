import { ensureInjected } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { PageType } from "../../core/pages.js";
import { isOwnFactionMainTab } from "../../core/torn-page.js";
import { readChainTimer, stopAlert, updateAlert } from "./alert.js";
import {
  BOARD_FRESH_MS,
  cachedBoard,
  cachedWatches,
  checkIn,
  checkOut,
  claimSlot,
  clearChainWatchCache,
  errorMessage,
  fetchBoard,
  getActiveWatches,
  leaveSlot,
  respondToPrompt,
  searchMembers,
  sendTestDm,
} from "./data.js";
import { AlertMode, formatAlertTime, getPrefs, parseAlertTime, setPrefs } from "./prefs.js";
import { renderBar, renderPanel, renderSettings, slotLabel } from "./view.js";

// Chain watch bar on your own faction's main page, under Torn's war/chain
// list. Collapsed it is a single line: what the nuke.family chain watch needs
// from you right now (check in, your next slot, "still watching?") plus the
// chain timer alert switch. Expanding it shows the roster, who is checked in
// (staff can check members in and out) and the hourly slots to sign up for.
//
// Kept cheap on purpose, since this page is busiest during wars and chains:
// no request at all on most page loads (the "is there a watch" answer is
// cached), one 1s timer that does almost nothing unless the alert is armed,
// polling only while the tab is visible, and DOM writes only when the HTML
// actually changed.

const ROOT_ID = "nfh-chain-watch";
const ANCHOR_SELECTOR = "#faction_war_list_id";
const HOUR_MS = 60 * 60 * 1000;

// How often the board is refetched while the page stays open.
const POLL_EXPANDED_MS = 60 * 1000;
const POLL_ENGAGED_MS = 2 * 60 * 1000; // collapsed, but checked in or signed up
const POLL_IDLE_MS = 5 * 60 * 1000;
// With no watch running, how often to look at the (cached) watch list again.
const LIST_RECHECK_MS = 60 * 1000;
const TEST_ALERT_MS = 5000;

const state = {
  watches: [],
  watchId: null,
  board: null,
  lastFetchAt: 0, // when the board was last fetched (or tried)
  lastListAt: 0,
  loading: false,
  busy: false, // an action (sign up, check in, ...) is in flight
  flash: null, // transient { text, error, until } shown in the bar
  settingsOpen: false,
  testUntil: 0,
  chainActive: false, // Torn's chain box currently says "Chain active"
  ui: {
    selectedSlot: null,
    searchQuery: "",
    searchResults: null,
    searchLoading: false,
  },
};

let root = null;
let regions = {};
let renderedHtml = {};
let ticker = null;
let tickCount = 0;
let searchTimer = null;

// Wall marking is plain CSS keyed off a body class, so it follows Torn's war
// lists as they re-render without any polling.
function applyWallMarking() {
  document.body.classList.toggle("nfh-mark-wall", getPrefs().markWall);
}

function isCheckedIn() {
  return (
    !!state.board &&
    (state.board.checkins || []).some((checkin) => checkin.is_me)
  );
}

// Whether the chain timer alert should react to Torn's chain right now.
// state.board is only ever an active (not finished) chain watch.
function isArmed() {
  switch (getPrefs().alertMode) {
    case AlertMode.Always:
      return true;
    case AlertMode.Watch:
      return !!state.board;
    case AlertMode.CheckedIn:
      return isCheckedIn();
    default:
      return false;
  }
}

function setBoard(board) {
  // A watch that ended since the list was cached: drop it and look again.
  if (!board || board.is_finished || board.status !== "active") {
    clearChainWatchCache();
    state.board = null;
    state.watchId = null;
    state.watches = [];
    state.lastListAt = 0;
    return;
  }
  state.board = board;
  const selected = state.ui.selectedSlot;
  if (selected && !board.slots.some((slot) => slot.slot_start_iso === selected)) {
    state.ui.selectedSlot = null;
  }
}

function setFlash(text, error = false) {
  state.flash = { text, error, until: Date.now() + (error ? 7000 : 4000) };
}

function setRegion(name, html) {
  if (renderedHtml[name] === html) return;
  renderedHtml[name] = html;

  const region = regions[name];
  // Re-rendering must not take the staff search box away from someone typing.
  const active = document.activeElement;
  const typing =
    active && region.contains(active) && active.dataset.role === "member-search"
      ? [active.selectionStart, active.selectionEnd]
      : null;

  region.innerHTML = html;

  if (typing) {
    const input = region.querySelector('[data-role="member-search"]');
    if (input) {
      input.focus();
      input.setSelectionRange(typing[0], typing[1]);
    }
  }
}

function render() {
  if (!root || !root.isConnected) return;

  const now = Date.now();
  const prefs = getPrefs();
  const bar = renderBar({
    board: state.board,
    watches: state.watches,
    prefs,
    armed: isArmed(),
    chainActive: state.chainActive,
    flash: state.flash,
    busy: state.busy,
    now,
  });
  setRegion("bar", bar.html);
  root.className = "nfh-cw" + (bar.tone ? ` nfh-cw--${bar.tone}` : "");

  const showPanel = !!state.board && prefs.expanded;
  regions.panel.hidden = !showPanel;
  if (showPanel) {
    setRegion(
      "panel",
      renderPanel({ board: state.board, prefs, ui: state.ui, busy: state.busy, now }),
    );
  }
  regions.settings.hidden = !state.settingsOpen;
}

// The settings are only rendered when opened: re-rendering them while a
// slider is being dragged would cut the drag short.
function renderSettingsRegion() {
  regions.settings.innerHTML = renderSettings({
    prefs: getPrefs(),
    legacyScript: !!document.getElementById("JoxDiv"),
  });
}

async function refreshBoard() {
  if (state.loading || state.watchId === null) return;
  state.loading = true;
  state.lastFetchAt = Date.now();
  try {
    setBoard(await fetchBoard(state.watchId));
  } catch (error) {
    LogInfo("Chain watch board fetch failed:", error);
    if (error && (error.status === 403 || error.status === 404)) {
      setBoard(null);
    }
  } finally {
    state.loading = false;
    render();
  }
}

// Work out which watch (if any) to show, paint it from cache, and refetch
// the board if the cached copy is not fresh.
async function load({ force = false } = {}) {
  state.lastListAt = Date.now();
  state.watches = await getActiveWatches({ force });
  if (!state.watches.some((watch) => watch.id === state.watchId)) {
    state.watchId = state.watches.length ? state.watches[0].id : null;
    state.board = null;
  }
  if (state.watchId === null) {
    state.board = null;
    render();
    return;
  }

  const cached = cachedBoard(state.watchId);
  if (cached && cached.timestamp > state.lastFetchAt) {
    state.lastFetchAt = cached.timestamp;
    setBoard(cached.board);
  }
  render();

  if (state.watchId !== null && (force || Date.now() - state.lastFetchAt > BOARD_FRESH_MS)) {
    await refreshBoard();
  }
}

function pollDue(now) {
  // Nothing is fetched for a tab nobody is looking at, or while the faction
  // page is showing another tab.
  if (document.hidden || root.offsetParent === null || state.loading || state.busy) {
    return false;
  }
  if (state.watchId === null) {
    return now - state.lastListAt > LIST_RECHECK_MS;
  }

  // Just after each hour turns over the slots and statuses roll forward.
  const sinceHour = now % HOUR_MS;
  if (sinceHour > 20000 && state.lastFetchAt < now - sinceHour) {
    return true;
  }

  let interval = POLL_IDLE_MS;
  if (getPrefs().expanded) {
    interval = POLL_EXPANDED_MS;
  } else if (
    isCheckedIn() ||
    (state.board &&
      state.board.slots.some((slot) => slot.signups.some((signup) => signup.is_me)))
  ) {
    interval = POLL_ENGAGED_MS;
  }
  return now - state.lastFetchAt > interval;
}

function tick() {
  // Torn rebuilt the panel (or we left the page): stop until init() remounts.
  if (!root || !root.isConnected) {
    stop();
    return;
  }

  const now = Date.now();
  const timer = readChainTimer();
  updateAlert({ timer, armed: isArmed(), test: now < state.testUntil });

  const chainActive = !!timer && timer.active;
  if (chainActive !== state.chainActive) {
    state.chainActive = chainActive;
    render();
  } else if (state.flash && now > state.flash.until) {
    state.flash = null;
    render();
  } else if (++tickCount % 15 === 0) {
    // Keeps the "in 7m" / "checked in 23m" texts moving.
    render();
  }

  if (pollDue(now)) {
    if (state.watchId === null) {
      load();
    } else {
      refreshBoard();
    }
  }
}

function stop() {
  clearInterval(ticker);
  ticker = null;
  root = null;
  stopAlert();
}

// Run a signup / check-in action. `work` resolves with the fresh board (or
// nothing, for calls that do not return one).
async function act(work, successText, failureText) {
  if (state.busy || state.watchId === null) return;
  state.busy = true;
  render();
  try {
    const board = await work(state.watchId);
    if (board) {
      state.lastFetchAt = Date.now();
      setBoard(board);
    }
    setFlash(successText);
  } catch (error) {
    LogInfo("Chain watch action failed:", error);
    setFlash(errorMessage(error, failureText), true);
  } finally {
    state.busy = false;
    render();
  }
}

// After staff check someone in or out, keep the search results in step.
function markSearchResult(playerId, checkedIn) {
  for (const member of state.ui.searchResults || []) {
    if (Number(member.player_id) === playerId) member.checked_in = checkedIn;
  }
}

function onClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target || !root.contains(target)) return;
  const { action } = target.dataset;

  switch (action) {
    case "toggle":
      if (!state.board) return;
      setPrefs({ expanded: !getPrefs().expanded });
      render();
      if (getPrefs().expanded && Date.now() - state.lastFetchAt > BOARD_FRESH_MS) {
        refreshBoard();
      }
      break;

    case "settings":
      state.settingsOpen = !state.settingsOpen;
      if (state.settingsOpen) renderSettingsRegion();
      render();
      break;

    case "test-alert":
      state.testUntil = Date.now() + TEST_ALERT_MS;
      updateAlert({ timer: readChainTimer(), armed: isArmed(), test: true });
      break;

    case "refresh":
      load({ force: true });
      break;

    case "slot":
      state.ui.selectedSlot =
        state.ui.selectedSlot === target.dataset.slot ? null : target.dataset.slot;
      render();
      break;

    case "checkin":
      act((id) => checkIn(id), "You are checked in.", "Could not check you in.");
      break;

    case "checkout":
      act(
        (id) => checkOut(id),
        "You are checked out. Thanks for watching!",
        "Could not check you out.",
      );
      break;

    case "stay": {
      const checkinId = target.dataset.checkin;
      act(
        async (id) => {
          await respondToPrompt(id, checkinId, "stay");
          return fetchBoard(id);
        },
        "Thanks, you stay checked in.",
        "Could not record your answer.",
      );
      break;
    }

    case "staff-in":
    case "staff-out": {
      const playerId = Number(target.dataset.player);
      const checkingIn = action === "staff-in";
      act(
        async (id) => {
          const board = await (checkingIn ? checkIn(id, playerId) : checkOut(id, playerId));
          markSearchResult(playerId, checkingIn);
          return board;
        },
        checkingIn ? "Member checked in." : "Member checked out.",
        "Could not update their check-in.",
      );
      break;
    }

    case "signup": {
      const { slot } = target.dataset;
      act(
        (id) => claimSlot(id, slot, getPrefs().dmReminder),
        `Signed up for ${slotLabel(Date.parse(slot))} TCT.`,
        "Could not sign you up.",
      );
      break;
    }

    case "leave": {
      const { slot } = target.dataset;
      act(
        (id) => leaveSlot(id, slot),
        `You left ${slotLabel(Date.parse(slot))} TCT.`,
        "Could not remove your signup.",
      );
      break;
    }

    case "test-dm":
      act(
        async (id) => {
          await sendTestDm(id);
        },
        "Test sent. Check your Discord DMs.",
        "Could not send a test notification.",
      );
      break;
  }
}

function runSearch(query) {
  searchTimer = setTimeout(async () => {
    const watchId = state.watchId;
    state.ui.searchLoading = true;
    render();
    try {
      const results = await searchMembers(watchId, query);
      // Ignore answers to a query the user has since typed past.
      if (state.ui.searchQuery.trim() === query) {
        state.ui.searchResults = results;
      }
    } catch (error) {
      state.ui.searchResults = null;
      setFlash(errorMessage(error, "Could not search the faction members."), true);
    } finally {
      state.ui.searchLoading = false;
      render();
    }
  }, 350);
}

function onInput(event) {
  const target = event.target;

  if (target.dataset.role === "member-search") {
    state.ui.searchQuery = target.value;
    clearTimeout(searchTimer);
    const query = target.value.trim();
    if (query.length < 2) {
      if (state.ui.searchResults) {
        state.ui.searchResults = null;
        render();
      }
      return;
    }
    runSearch(query);
    return;
  }

  // Sliders and the colour picker apply live (the Test button previews them).
  switch (target.dataset.pref) {
    case "opacity":
    case "volume":
      setPrefs({ [target.dataset.pref]: Number(target.value) / 100 });
      break;
    case "color":
      setPrefs({ color: target.value });
      break;
  }
}

function onChange(event) {
  const target = event.target;

  if (target.dataset.role === "watch-picker") {
    state.watchId = Number(target.value);
    state.board = null;
    state.lastFetchAt = 0;
    state.ui = { selectedSlot: null, searchQuery: "", searchResults: null, searchLoading: false };
    load();
    return;
  }

  switch (target.dataset.pref) {
    case "alertMode":
      setPrefs({ alertMode: target.value });
      // The explanation under the dropdown follows the choice.
      renderSettingsRegion();
      regions.settings.querySelector('[data-pref="alertMode"]').focus();
      break;
    case "pace":
      setPrefs({ pace: target.value });
      break;
    case "alertSeconds": {
      const seconds = parseAlertTime(target.value);
      if (seconds !== null) setPrefs({ alertSeconds: seconds });
      // Shows the normalised value, or puts the old one back if it was invalid.
      target.value = formatAlertTime(getPrefs().alertSeconds);
      target.classList.toggle("is-invalid", seconds === null);
      break;
    }
    case "beep":
    case "markWall":
    case "dmReminder":
      setPrefs({ [target.dataset.pref]: target.checked });
      applyWallMarking();
      break;
    default:
      return;
  }
  render();
}

function mount(anchor) {
  root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "nfh-cw";
  root.innerHTML =
    '<div class="nfh-cw-bar"></div>' +
    '<div class="nfh-cw-settings" hidden></div>' +
    '<div class="nfh-cw-panel" hidden></div>';
  regions = {
    bar: root.querySelector(".nfh-cw-bar"),
    settings: root.querySelector(".nfh-cw-settings"),
    panel: root.querySelector(".nfh-cw-panel"),
  };
  renderedHtml = {};
  state.settingsOpen = false;

  root.addEventListener("click", onClick);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);
  anchor.insertAdjacentElement("afterend", root);

  // First paint straight from cache, so the bar does not change under the
  // user a moment after the page loads.
  if (state.watchId === null) {
    state.watches = cachedWatches();
    state.watchId = state.watches.length ? state.watches[0].id : null;
  }
  if (state.watchId !== null && !state.board) {
    const cached = cachedBoard(state.watchId);
    if (cached) {
      state.lastFetchAt = cached.timestamp;
      setBoard(cached.board);
    }
  }
  render();

  if (!ticker) {
    ticker = setInterval(tick, 1000);
  }
  load();
  LogInfo("Chain watch bar inserted");
}

function init() {
  applyWallMarking();
  if (!isOwnFactionMainTab()) return;

  // Guard on DOM presence: Torn rebuilds the main panel when you switch tabs
  // and come back, which removes the bar.
  ensureInjected({
    containerSelector: ANCHOR_SELECTOR,
    isPresent: () => !!document.getElementById(ROOT_ID),
    inject: mount,
  });
}

export default {
  name: "chain-watch",
  pages: [PageType.Faction],
  init,
};
