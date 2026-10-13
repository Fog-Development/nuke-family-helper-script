import { api, ApiError } from "../core/api.js";
import { getApiToken } from "../core/auth.js";
import { registeredStores } from "../core/cache-sync.js";
import { API_URL, CURRENT_VERSION, DEBUG } from "../core/config.js";
import { isPda } from "../core/pda-polyfill.js";
import { getUserscriptUsersPlayerId } from "../core/torn-page.js";
import { getUserRole } from "../core/user.js";
import { ocConfigStore } from "./organized-crimes/data.js";
import { cachedBoard } from "./organized-crimes/remote.js";
import { memberFeatures } from "./organized-crimes/scoring.js";

// A report a member can copy and send when something is not showing up for
// them: what the script has stored, and what nuke.family answers to this
// member's key right now. It never holds the key itself, nor anything about
// other members.

const DIALOG_ID = "nfh-debug-dialog";

const iso = (ms) => (ms ? new Date(ms).toISOString() : null);

// One request, reduced to what matters: the status and, through `summarise`,
// the few fields worth reading. A refusal keeps the site's own reason.
async function probe(path, summarise = () => undefined) {
  try {
    const body = await api(path);
    return { status: 200, ...summarise(body) };
  } catch (error) {
    if (error instanceof ApiError) {
      const reason = error.body && (error.body.error || error.body.message);
      return { status: error.status, error: reason || null };
    }
    return { status: null, error: "No answer (network error or timeout)" };
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

  const [roles, permissions, lastUpdates, ocConfig, ocBoard] = await Promise.all([
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

async function copyText(text, textarea) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Older browsers and some in-app views: copy the selection instead.
    textarea.select();
    try {
      return document.execCommand("copy");
    } catch (e) {
      return false;
    }
  }
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
    '<p class="nfh-debug-note">Copy this and send it to whoever is helping you. It does not contain your key.</p>' +
    '<textarea class="nfh-debug-text" readonly spellcheck="false"></textarea>' +
    '<div class="nfh-debug-actions">' +
    '<span class="nfh-debug-status" role="status"></span>' +
    '<button type="button" class="torn-btn" data-nfh-debug-copy>Copy</button>' +
    '<button type="button" class="torn-btn" data-nfh-debug-close>Close</button>' +
    "</div></div>";

  const textarea = overlay.querySelector("textarea");
  textarea.value = text;
  const status = overlay.querySelector(".nfh-debug-status");

  overlay.addEventListener("click", async (event) => {
    if (event.target === overlay || event.target.closest("[data-nfh-debug-close]")) {
      overlay.remove();
      return;
    }
    if (event.target.closest("[data-nfh-debug-copy]")) {
      status.textContent = (await copyText(text, textarea)) ? "Copied." : "Could not copy: select the text and copy it yourself.";
    }
  });

  document.body.appendChild(overlay);
  textarea.focus();
  textarea.select();
  textarea.scrollTop = 0;
}
