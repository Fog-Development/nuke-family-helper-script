import { api, ApiError } from "../../core/api.js";
import { getApiToken } from "../../core/auth.js";
import { ensureInjected, escapeHtml } from "../../core/dom.js";
import { LogInfo } from "../../core/log.js";
import { getItem, setItem } from "../../core/storage.js";
import { hintFor } from "./logic.js";

// A quiet "No OC · 5h" chip beside My Faction in Torn's sidebar while the
// member isn't in an organized crime (in the phone layout's fly-out sidebar
// too, with a small dot on its closed menu button once the chip turns amber). Drawn once per page from nuke.family's
// `/oc/me` (the five-minute crime sync's record of the member), never from
// watching Torn: no toast, sound or title change, nothing on an unfocused page.
// Not a registered feature: `main.js` calls initOcHint() on every Torn page.

const CHIP_ID = "nfh-oc-hint";
const DOT_ID = "nfh-oc-hint-dot";
const SIDEBAR = "#nav-faction";
const MENU_BUTTON = "#fly-out-menu-button";
const CRIMES_URL = "/factions.php?step=your#/tab=crimes";
const CACHE_KEY = "nfhOcMe";
const TTL_MS = 5 * 60 * 1000;
// Not in a Nuke faction (or a site without the route): don't ask again for a while.
const REFUSED_TTL_MS = 12 * 60 * 60 * 1000;
const PREF_KEY = "nfhOcHint";

export function hintShown() {
  return getItem(PREF_KEY) !== "off";
}

export function setHintShown(shown) {
  setItem(PREF_KEY, shown ? "on" : "off");
  if (shown) initOcHint();
  else removeChip();
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < (cached.refused ? REFUSED_TTL_MS : TTL_MS)) return cached;
  } catch (e) {
    // fetch again
  }
  return null;
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), ...entry }));
  } catch (e) {
    // a full or blocked localStorage only costs a request next page
  }
}

async function loadStatus() {
  const cached = readCache();
  if (cached) return cached.refused ? null : cached.data;
  try {
    const answer = await api("/oc/me");
    writeCache({ data: answer.data });
    return answer.data;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      writeCache({ refused: true });
    }
    LogInfo("[oc-hint] no status", error);
    return null;
  }
}

function removeChip() {
  for (const id of [CHIP_ID, DOT_ID]) {
    const element = document.getElementById(id);
    if (element) element.remove();
  }
}

// The crimes page saw the member in a slot: drop the chip now rather than in
// up to five minutes, when the site's next answer would.
export function markInOc() {
  const cached = readCache();
  if (cached && cached.data && cached.data.state === "in_oc") return;
  writeCache({ data: { enabled: true, state: "in_oc", idle_since: null } });
  removeChip();
}

export async function initOcHint() {
  if (!getApiToken() || !hintShown()) return;
  const hint = hintFor(await loadStatus(), Math.floor(Date.now() / 1000));
  if (!hint) {
    removeChip();
    return;
  }

  ensureInjected({
    containerSelector: SIDEBAR,
    isPresent: () => document.getElementById(CHIP_ID) !== null,
    inject: (area) => {
      const row = area.querySelector('[class*="areaRow"]') || area;
      const chip = document.createElement("a");
      chip.id = CHIP_ID;
      chip.href = CRIMES_URL;
      chip.className = `nfh-oc-hint nfh-oc-hint--${hint.tone}`;
      chip.title = hint.title;
      chip.setAttribute("aria-label", hint.title);
      // The age is dropped in the phone layout's narrow fly-out (styles.css).
      chip.innerHTML = `No OC<span class="nfh-oc-hint__age"> · ${escapeHtml(hint.age)}</span>`;
      row.appendChild(chip);
    },
  });

  // Phones: the sidebar is behind a menu button, so a dot says there's something to see.
  if (hint.tone === "warn" && document.querySelector(MENU_BUTTON)) {
    ensureInjected({
      containerSelector: MENU_BUTTON,
      isPresent: () => document.getElementById(DOT_ID) !== null,
      inject: (button) => {
        const dot = document.createElement("span");
        dot.id = DOT_ID;
        dot.className = "nfh-oc-hint-dot";
        dot.title = hint.title;
        button.appendChild(dot);
      },
    });
  }
}
