import { api } from "../../core/api.js";
import { WINDOW_SECONDS } from "./logic.js";

// nuke.family retal API, and the attack ids this browser has already dealt
// with. The site ignores an attack it has counted, but not sending it again
// saves the request.

const SENT_KEY = "nfhRetalsSent";
// Kept a little longer than the window, after which the site drops them anyway.
const SENT_KEEP_SECONDS = WINDOW_SECONDS * 2;

let sent = null;

function load() {
  if (sent) return sent;
  sent = new Map();
  try {
    const stored = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
    for (const [id, at] of Object.entries(stored)) sent.set(id, Number(at));
  } catch (e) {
    // A broken list is just forgotten.
  }
  return sent;
}

function save() {
  const oldest = Math.floor(Date.now() / 1000) - SENT_KEEP_SECONDS;
  for (const [id, at] of sent) if (at < oldest) sent.delete(id);
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(Object.fromEntries(sent)));
  } catch (e) {
    // Storage full or blocked: the in-memory list still works for this page.
  }
}

// The ids already dealt with, as a Set for the rules in logic.js.
export function sentIds() {
  return new Set(load().keys());
}

// Remember attacks as dealt with. `attacks` are raw ({ publicID,
// finishTimestamp }) or normalized ({ id, finished_at }).
export function markSent(attacks) {
  const list = load();
  for (const attack of attacks) {
    const id = String(attack.id ?? attack.publicID);
    const at = attack.finished_at ?? Math.floor(Number(attack.finishTimestamp) / 1000);
    list.set(id, at);
  }
  save();
}

// Send attacks to the site. Answers { server_now, retals }.
export function report(factionId, attacks) {
  return api("/retals/report", { method: "POST", data: { faction_id: factionId, attacks } });
}

// The faction's open retals. Answers { server_now, retals }.
export function fetchRetals() {
  return api("/retals");
}

// Hold a retal for 45s (or refresh your own hold). A 409 ApiError means
// someone else holds it; its body carries `claimed_by` and the list.
export function claimRetal(enemyId) {
  return api(`/retals/${enemyId}/claim`, { method: "POST" });
}

export function unclaimRetal(enemyId) {
  return api(`/retals/${enemyId}/unclaim`, { method: "POST" });
}
