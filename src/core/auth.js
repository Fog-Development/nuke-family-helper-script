import { getValue, setValue } from "./storage.js";

// The nuke.family API token, kept in the userscript manager's storage so it
// survives across pages and (unlike localStorage) is not accessible to the
// Torn page itself; in TornPDA, in the app's own store (see storage.js).
//
// How the script gets one is in features/connect.js. This module only holds
// it, and knows whether it is working.
let apiToken = "";

// The Torn page to send the user back to once nuke.family's token-generation
// page has captured their key (the older way of connecting; still honoured).
const RETURN_URL_KEY = "nfhTokenReturnUrl";

export function initAuth() {
  apiToken = getValue("apiToken", "");
}

export function getApiToken() {
  return apiToken;
}

export function setApiToken(token) {
  apiToken = token;
  setValue("apiToken", token);
  rejected = false;
  noAnswers = 0;
  notify();
}

// Whether the script can talk to nuke.family as this member, as far as this
// page load has seen. The script used to fail silently when it could not;
// everything that tells the member so hangs off this.
export const Connection = {
  Connected: "connected",
  // No key stored: never connected, or storage was wiped.
  Missing: "missing",
  // nuke.family answered a call made with the key with "not logged in".
  Rejected: "rejected",
  // Calls are getting no answer at all, and none has got through.
  Unreachable: "unreachable",
};

const UNREACHABLE_AFTER = 2;

let rejected = false;
let answers = 0;
let noAnswers = 0;
const listeners = [];

export function connectionState() {
  if (!apiToken) return Connection.Missing;
  if (rejected) return Connection.Rejected;
  if (answers === 0 && noAnswers >= UNREACHABLE_AFTER) return Connection.Unreachable;
  return Connection.Connected;
}

export function onConnectionChange(listener) {
  listeners.push(listener);
}

let lastState = null;
function notify() {
  const state = connectionState();
  if (state === lastState) return;
  lastState = state;
  for (const listener of listeners) {
    try {
      listener(state);
    } catch (error) {
      console.error("[NFH] Connection listener failed:", error);
    }
  }
}

// Reported by api(): how each call made with the stored key went.
export function noteAnswer() {
  answers += 1;
  notify();
}

export function noteKeyRejected() {
  rejected = true;
  notify();
}

export function noteNoAnswer() {
  noAnswers += 1;
  notify();
}

// Consume the Torn URL stored before a trip to the token-generation page.
// Returns it once (then clears it), or null if the user got there another way.
export function takeTokenReturnUrl() {
  const url = getValue(RETURN_URL_KEY, "");
  if (!url) return null;
  setValue(RETURN_URL_KEY, "");
  return url.startsWith("https://www.torn.com/") ? url : null;
}
