import { api, ApiError, NoAnswerError, pageRequest } from "../core/api.js";
import { getApiToken } from "../core/auth.js";
import { registeredStores } from "../core/cache-sync.js";
import { API_URL, CURRENT_VERSION, DEBUG, DEBUG_SITE } from "../core/config.js";
import { isPda } from "../core/pda-polyfill.js";
import { storageInfo } from "../core/storage.js";
import { getUserscriptUsersPlayerId } from "../core/torn-page.js";
import { getUserRole } from "../core/user.js";
import { ocConfigStore } from "./organized-crimes/data.js";
import { cachedBoard } from "./organized-crimes/remote.js";
import { memberFeatures } from "./organized-crimes/scoring.js";

// A report a member can copy and send when something is not showing up for
// them: what the script has stored, and what nuke.family answers to this
// member's key right now. It never holds the key itself, nor anything about
// other members.
//
// It is too long for a Discord message, so it can also be sent to nuke.family
// (`POST /script/debug-report`, which needs no key, since a bad key may be
// the problem) in exchange for a short reference to pass on instead.

const DIALOG_ID = "nfh-debug-dialog";

const iso = (ms) => (ms ? new Date(ms).toISOString() : null);

const NO_ANSWER = {
  network: "No answer: the request failed before any reply (offline, blocked, or the app could not make it)",
  timeout: "No answer: timed out",
  empty: "No answer: the userscript manager returned nothing",
  not_json: "A reply that is not from the nuke.family API (a block or challenge page, usually)",
};

// What went wrong with a request, in the report's terms. A refusal keeps the
// site's own reason; anything else says how it failed and what little came back.
function failure(error) {
  if (error instanceof ApiError) {
    const reason = error.body && (error.body.error || error.body.message);
    const result = { status: error.status, error: reason || null };
    if (error.raw) result.reply_starts = error.raw;
    return result;
  }
  if (error instanceof NoAnswerError) {
    const result = { status: error.status, error: NO_ANSWER[error.kind] || error.kind, failure: error.kind };
    if (error.detail) result[error.kind === "not_json" ? "reply_starts" : "detail"] = error.detail;
    return result;
  }
  return { status: null, error: "The script could not read the reply", failure: "script", detail: String(error && error.message) };
}

// One request, reduced to what matters: the status and, through `summarise`,
// the few fields worth reading.
async function probe(path, summarise = () => undefined) {
  try {
    const body = await api(path, { feature: "debug-info" });
    return { status: 200, ...summarise(body) };
  } catch (error) {
    return failure(error);
  }
}

// Whether the page itself can reach nuke.family, asked without the key (so
// the site's answer is a 401). With the probes above failing, this is what
// separates "the userscript manager's requests are not getting out" from
// "this device cannot reach nuke.family".
async function probeFromPage() {
  try {
    await pageRequest("/cache/last-updates");
    return { reached: true, status: 200 };
  } catch (error) {
    const result = failure(error);
    return { reached: error instanceof ApiError, ...result };
  }
}

function ocConfigSummary(config) {
  if (!config) return { present: false };
  return {
    present: true,
    settings: config.settings || null,
    crimes: Array.isArray(config.crimes) ? config.crimes.length : null,
    weights_synced_at: config.weights_synced_at ?? null,
    member_features: memberFeatures(config),
  };
}

function boardSummary(board) {
  if (!board) return { present: false };
  return {
    present: true,
    synced_at: board.synced_at ?? null,
    crimes: Array.isArray(board.crimes) ? board.crimes.length : null,
    my_level: board.me ? board.me.level : null,
    my_known_cprs: board.me && board.me.cprs ? Object.keys(board.me.cprs).length : null,
    sees_staff_flags: Boolean(board.members),
  };
}

// Every localStorage entry of ours, by size only: what is stored can hold
// other players' names.
function storedKeys() {
  const keys = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (/^nfh/i.test(key)) keys[key] = (localStorage.getItem(key) || "").length;
  }
  return keys;
}

function countOf(data) {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") return Object.keys(data).length;
  return data === null || data === undefined ? null : 1;
}

export async function collectDebugInfo() {
  const token = getApiToken() || "";
  const info = typeof GM_info !== "undefined" && GM_info ? GM_info : {};
  const board = cachedBoard();

  const [storage, fromPage, roles, permissions, lastUpdates, ocConfig, ocBoard] = await Promise.all([
    storageInfo(),
    probeFromPage(),
    probe("/user/get-own-roles", (body) => ({ role: body.role ?? null })),
    probe("/user/get-own-permissions", (body) => ({ permissions: body.permissions || [] })),
    probe("/cache/last-updates", (body) => ({ timestamps: body })),
    probe("/oc/config", (body) => ocConfigSummary(body.data || null)),
    probe("/oc/board", (body) => boardSummary(body.data || null)),
  ]);

  return {
    generated_at: new Date().toISOString(),
    script: {
      version: CURRENT_VERSION,
      debug_build: DEBUG,
      debug_site: DEBUG_SITE,
      api_url: API_URL,
      manager: info.scriptHandler ? `${info.scriptHandler} ${info.version || ""}`.trim() : null,
      torn_pda: isPda,
    },
    browser: { user_agent: navigator.userAgent, page: window.location.href },
    torn_player_id: getUserscriptUsersPlayerId() || null,
    key: { stored: token.length > 0, length: token.length, accepted: roles.status === 200 },
    site_now: {
      "/user/get-own-roles": roles,
      "/user/get-own-permissions": permissions,
      "/cache/last-updates": lastUpdates,
      "/oc/config": ocConfig,
      "/oc/board": ocBoard,
    },
    site_from_page: fromPage,
    storage,
    stored: {
      role: getUserRole() || null,
      stores: Object.fromEntries(
        registeredStores().map((store) => [
          store.storageKey,
          { fetched_at: iso(store.timestamp), entries: countOf(store.data), stale: store.isStale() },
        ]),
      ),
      oc_config: ocConfigSummary(ocConfigStore.data),
      oc_board: board ? { fetched_at: iso(board.fetchedAt), ...boardSummary(board.board) } : { present: false },
      keys: storedKeys(),
    },
  };
}

async function copyText(text, field) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Older browsers and some in-app views: copy the selection instead.
    field.select();
    try {
      return document.execCommand("copy");
    } catch (e) {
      return false;
    }
  }
}

// Send the report to nuke.family. Resolves with { reference } or { error }.
// When the userscript manager's request gets no answer, the page sends it
// instead (the route needs no key), and the report says so.
export async function sendDebugInfo(report) {
  const path = "/script/debug-report";
  let error;
  try {
    return { reference: (await api(path, { method: "POST", data: { report } })).reference };
  } catch (first) {
    error = first;
  }

  if (!(error instanceof ApiError)) {
    try {
      const data = { report: { ...report, sent_by: "page", send_failure: failure(error) } };
      return { reference: (await pageRequest(path, { method: "POST", data })).reference };
    } catch (second) {
      if (second instanceof ApiError) error = second;
    }
  }

  if (error instanceof ApiError) {
    if (error.status === 429) return { error: "Too many reports sent from here. Try again in a few minutes." };
    const reason = error.body && (error.body.error || error.body.message);
    return { error: reason || `nuke.family refused it (status ${error.status}).` };
  }
  return { error: "Could not reach nuke.family." };
}

// Show the report in a box the member can copy from.
export function showDebugInfo(report) {
  const existing = document.getElementById(DIALOG_ID);
  if (existing) existing.remove();

  const text = JSON.stringify(report, null, 2);
  const overlay = document.createElement("div");
  overlay.id = DIALOG_ID;
  overlay.className = "nfh-debug-overlay";
  overlay.innerHTML =
    '<div class="nfh-debug-dialog" role="dialog" aria-modal="true" aria-label="Nuke Family Helper debug info">' +
    '<div class="nfh-debug-title">Nuke Family Helper debug info</div>' +
    '<p class="nfh-debug-note">Send this to the developer and pass on the short reference you get back, ' +
    "or copy the whole report. It does not contain your key.</p>" +
    '<textarea class="nfh-debug-text" readonly spellcheck="false"></textarea>' +
    '<div class="nfh-debug-sent" hidden>Sent. Your reference is ' +
    '<input type="text" class="nfh-debug-reference" readonly aria-label="Reference"> ' +
    '<button type="button" class="torn-btn" data-nfh-debug-copy-reference>Copy reference</button></div>' +
    '<div class="nfh-debug-actions">' +
    '<span class="nfh-debug-status" role="status"></span>' +
    '<button type="button" class="torn-btn" data-nfh-debug-send>Send to developer</button>' +
    '<button type="button" class="torn-btn" data-nfh-debug-copy>Copy report</button>' +
    '<button type="button" class="torn-btn" data-nfh-debug-close>Close</button>' +
    "</div></div>";

  const textarea = overlay.querySelector("textarea");
  textarea.value = text;
  const status = overlay.querySelector(".nfh-debug-status");
  const sent = overlay.querySelector(".nfh-debug-sent");
  const reference = overlay.querySelector(".nfh-debug-reference");

  overlay.addEventListener("click", async (event) => {
    if (event.target === overlay || event.target.closest("[data-nfh-debug-close]")) {
      overlay.remove();
      return;
    }
    if (event.target.closest("[data-nfh-debug-copy]")) {
      status.textContent = (await copyText(text, textarea)) ? "Report copied." : "Could not copy: select the text and copy it yourself.";
      return;
    }
    if (event.target.closest("[data-nfh-debug-copy-reference]")) {
      status.textContent = (await copyText(reference.value, reference)) ? "Reference copied." : "Could not copy: type it out instead.";
      return;
    }
    const send = event.target.closest("[data-nfh-debug-send]");
    if (send && !send.disabled) {
      send.disabled = true;
      status.textContent = "Sending...";
      const outcome = await sendDebugInfo(report);
      if (outcome.reference) {
        reference.value = outcome.reference;
        sent.hidden = false;
        status.textContent = "";
        send.remove();
      } else {
        status.textContent = `${outcome.error} You can still copy the report.`;
        send.disabled = false;
      }
    }
  });

  document.body.appendChild(overlay);
  textarea.focus();
  textarea.select();
  textarea.scrollTop = 0;
}
