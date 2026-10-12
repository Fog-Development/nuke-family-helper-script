import { api } from "../../core/api.js";
import { getApiToken } from "../../core/auth.js";
import { LogInfo } from "../../core/log.js";
import { parseApiUtcDate } from "../../core/time.js";

// nuke.family chain watch API: the faction's active watches, one watch's
// signup board, and the signup / check-in actions. Every action answers with
// the fresh board, so the UI never needs a follow-up fetch.

const LIST_KEY = "nfhChainWatchList";
const BOARD_KEY = "nfhChainWatchBoard";

// Most visits to the faction page happen when no chain watch is running, so
// the (tiny) list of active watches is cached: within this window a page load
// costs no request at all.
const LIST_TTL_MS = 10 * 60 * 1000;
// After a failed list fetch, wait this long before trying again.
const LIST_RETRY_MS = 60 * 1000;
// A cached board younger than this is shown without refetching (covers quick
// tab switches and reloads); an older one is shown while the refetch runs.
export const BOARD_FRESH_MS = 45 * 1000;
const BOARD_MAX_AGE_MS = 15 * 60 * 1000;

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {
    return null;
  }
}

// The list endpoint gives "YYYY-MM-DD HH:MM:SS" (UTC); tolerate ISO as well.
function toMs(value) {
  if (!value) return null;
  const date = value.includes("T") ? new Date(value) : parseApiUtcDate(value);
  return date.getTime();
}

// Watches that have not ended, soonest start first (a running watch therefore
// comes before an upcoming one).
function usable(watches, now = Date.now()) {
  return (Array.isArray(watches) ? watches : [])
    .filter((watch) => {
      const end = toMs(watch.end_time);
      return end === null || end > now;
    })
    .sort((a, b) => toMs(a.start_time) - toMs(b.start_time));
}

export function cachedWatches() {
  const cached = readJson(LIST_KEY);
  return cached ? usable(cached.watches) : [];
}

// The user's faction's active chain watches ({ id, title, start_time,
// end_time }). Never throws: on failure it yields what was cached.
export async function getActiveWatches({ force = false } = {}) {
  const cached = readJson(LIST_KEY);
  if (
    !force &&
    cached &&
    cached.timestamp &&
    Date.now() - cached.timestamp < LIST_TTL_MS
  ) {
    return usable(cached.watches);
  }
  if (!getApiToken()) {
    return [];
  }

  try {
    const watches = (await api("/chain-watch")).data || [];
    localStorage.setItem(
      LIST_KEY,
      JSON.stringify({ watches, timestamp: Date.now() }),
    );
    return usable(watches);
  } catch (error) {
    LogInfo("Chain watch list fetch failed:", error);
    const watches = cached ? cached.watches : [];
    localStorage.setItem(
      LIST_KEY,
      JSON.stringify({
        watches,
        timestamp: Date.now() - LIST_TTL_MS + LIST_RETRY_MS,
      }),
    );
    return usable(watches);
  }
}

export function clearChainWatchCache() {
  localStorage.removeItem(LIST_KEY);
  localStorage.removeItem(BOARD_KEY);
}

// The last board seen for this watch, or null: { board, timestamp }.
export function cachedBoard(watchId) {
  const cached = readJson(BOARD_KEY);
  if (
    !cached ||
    !cached.board ||
    cached.board.id !== watchId ||
    Date.now() - cached.timestamp > BOARD_MAX_AGE_MS
  ) {
    return null;
  }
  return cached;
}

function remember(board) {
  localStorage.setItem(
    BOARD_KEY,
    JSON.stringify({ board, timestamp: Date.now() }),
  );
  return board;
}

async function boardCall(path, options) {
  return remember((await api(path, options)).data);
}

export function fetchBoard(watchId) {
  return boardCall(`/chain-watch/${watchId}`);
}

export function claimSlot(watchId, slotIso, wantDmReminder) {
  return boardCall(`/chain-watch/${watchId}/signups`, {
    method: "POST",
    data: { slot_start: slotIso, want_dm_reminder: wantDmReminder },
  });
}

// Sent as a POST with Laravel's method override rather than a real DELETE:
// TornPDA's request bridge only speaks GET and POST.
export function leaveSlot(watchId, slotIso) {
  return boardCall(`/chain-watch/${watchId}/signups?_method=DELETE`, {
    method: "POST",
    data: { slot_start: slotIso },
  });
}

// `source` labels the member's own check-in on the site's attendance history
// (without it the API assumes its other client, the Discord bot). playerId is
// only passed by staff acting for another member, which the site records as
// "staff" regardless.
function attendanceData(playerId) {
  return playerId
    ? { source: "userscript", player_id: playerId }
    : { source: "userscript" };
}

export function checkIn(watchId, playerId) {
  return boardCall(`/chain-watch/${watchId}/checkin`, {
    method: "POST",
    data: attendanceData(playerId),
  });
}

export function checkOut(watchId, playerId) {
  return boardCall(`/chain-watch/${watchId}/checkout`, {
    method: "POST",
    data: attendanceData(playerId),
  });
}

// Answer the "your slot ended, still watching?" question for an open
// check-in. action: "stay" | "checkout". Answers { ok }, not a board.
export function respondToPrompt(watchId, checkinId, action) {
  return api(`/chain-watch/${watchId}/checkins/${checkinId}/respond`, {
    method: "POST",
    data: { action },
  });
}

// Staff: faction members matching a Torn name or ID
// ([{ player_id, player_name, checked_in }]).
export async function searchMembers(watchId, query) {
  const result = await api(
    `/chain-watch/${watchId}/members?q=${encodeURIComponent(query)}`,
  );
  return result.data || [];
}

export function sendTestDm(watchId) {
  return api(`/chain-watch/${watchId}/test-notification`, { method: "POST", data: {} });
}

// A message fit for showing to the user from a failed call.
export function errorMessage(error, fallback) {
  if (error && error.status === 401) {
    return "Your Nuke Family key was rejected. Set a new one on the faction controls tab.";
  }
  if (error && error.body && typeof error.body.error === "string") {
    return error.body.error;
  }
  if (error && error.status === 403) {
    return "You don't have access to do that on this chain watch.";
  }
  return fallback;
}
