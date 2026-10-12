import { api } from "../../core/api.js";
import { LogInfo } from "../../core/log.js";
import { keyFor } from "./catalog.js";

// The two things this feature exchanges with nuke.family beyond the config:
//
// - the member's own CPRs, read off the crimes page and sent up. Torn only
//   publishes the CPR of whoever sits in a slot, so this is how the site (and
//   through it the staff, and this script on a later visit) knows what a
//   member could do in a crime they have not joined.
// - the faction's board: its recruiting crimes as the site last synced them,
//   for the crimes Torn has not lazy-loaded onto the page yet.
//
// Both are kept cheap: CPRs are only sent when one changed, in one request,
// and the board is cached for a minute.

const CPR_KEY = "nfhOcCprs";
const BOARD_KEY = "nfhOcBoard";
const UPLOAD_DELAY_MS = 4000;
export const BOARD_FRESH_MS = 60 * 1000;
const BOARD_RETRY_MS = 30 * 1000;

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {
    return null;
  }
}

// { known: { "crimekey|rolekey": cpr }, sent: { same shape } }
function cprState() {
  const state = readJson(CPR_KEY);
  return state && state.known && state.sent ? state : { known: {}, sent: {} };
}

let pending = new Map(); // "crimekey|rolekey" -> { crime, role, cpr }
let uploadTimer = null;

async function upload() {
  uploadTimer = null;
  const batch = [...pending.entries()];
  pending = new Map();
  if (batch.length === 0) return;

  try {
    await api("/oc/cpr", { method: "POST", data: { cprs: batch.map(([, entry]) => entry) } });
    const state = cprState();
    for (const [key, entry] of batch) state.sent[key] = entry.cpr;
    localStorage.setItem(CPR_KEY, JSON.stringify(state));
    LogInfo(`OC Assistant sent ${batch.length} CPRs`);
  } catch (error) {
    // Not marked as sent, so the next page view tries again.
    console.error("[NFH] Could not send CPRs to nuke.family:", error);
  }
}

// Note the viewer's CPR for every open slot on the page (an open slot shows
// the viewer's own number) and queue the ones the site has not been told.
export function learnCprs(crimes) {
  const state = cprState();
  let changed = false;

  for (const crime of crimes) {
    for (const slot of crime.slots) {
      if (slot.occupied || slot.cpr === null) continue;
      const key = `${keyFor(crime.name)}|${keyFor(slot.name)}`;
      if (state.known[key] !== slot.cpr) {
        state.known[key] = slot.cpr;
        changed = true;
      }
      if (state.sent[key] !== slot.cpr) {
        pending.set(key, { crime: crime.name, role: slot.name, cpr: slot.cpr });
      }
    }
  }

  if (changed) localStorage.setItem(CPR_KEY, JSON.stringify(state));
  if (pending.size > 0 && !uploadTimer) uploadTimer = setTimeout(upload, UPLOAD_DELAY_MS);
}

// The viewer's CPR for a role they are not looking at: what this browser has
// seen before, else what the site holds (seen on another device).
export function knownCpr(board, crimeName, roleName) {
  const crimeKey = keyFor(crimeName);
  const roleKey = keyFor(roleName);
  const local = cprState().known[`${crimeKey}|${roleKey}`];
  if (local !== undefined) return local;
  const remote = board && board.me && board.me.cprs && board.me.cprs[crimeKey];
  return remote && remote[roleKey] !== undefined ? remote[roleKey] : null;
}

export function cachedBoard() {
  const cached = readJson(BOARD_KEY);
  return cached && cached.board ? cached : null;
}

let boardRequest = null;
let lastBoardAttempt = 0;

// The faction's board, refetched when the cached copy is over a minute old.
// Resolves with true when a fresh copy arrived. Never throws.
export function refreshBoard() {
  const cached = cachedBoard();
  const now = Date.now();
  if (cached && now - cached.fetchedAt < BOARD_FRESH_MS) return Promise.resolve(false);
  if (boardRequest) return boardRequest;
  if (now - lastBoardAttempt < BOARD_RETRY_MS) return Promise.resolve(false);

  lastBoardAttempt = now;
  boardRequest = api("/oc/board")
    .then((response) => {
      localStorage.setItem(BOARD_KEY, JSON.stringify({ board: response.data, fetchedAt: Date.now() }));
      return true;
    })
    .catch((error) => {
      console.error("[NFH] Could not load the OC board from nuke.family:", error);
      return false;
    })
    .finally(() => {
      boardRequest = null;
    });
  return boardRequest;
}

// Recruiting crimes the site knows of that Torn has not put on the page yet,
// in the shape scoring.js rates, with the viewer's CPR filled in where it is
// known. `offPage` marks them: there is no element to tag.
export function offPageCrimes(board, pageCrimes) {
  if (!board || !Array.isArray(board.crimes)) return [];
  const onPage = new Set(pageCrimes.map((crime) => String(crime.id)));

  return board.crimes
    .filter((crime) => crime.status === "Recruiting" && !onPage.has(String(crime.id)))
    .filter((crime) => crime.slots.some((slot) => slot.player_id === null))
    .map((crime) => ({
      id: String(crime.id),
      name: crime.name,
      level: crime.level,
      offPage: true,
      slots: crime.slots.map((slot) => ({
        name: slot.role,
        occupied: slot.player_id !== null,
        progress: slot.progress || 0,
        cpr: slot.player_id !== null ? slot.cpr : knownCpr(board, crime.name, slot.role),
      })),
    }));
}
