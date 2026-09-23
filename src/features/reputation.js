import { api } from "../core/api.js";
import { escapeHtml, waitForElm } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { IsPage, PageType } from "../core/pages.js";
import { SettingsManager } from "../core/settings.js";
import { getPlayerId } from "../core/torn-page.js";
import { maybeAddRecruitingButton } from "./recruiting.js";

const REPUTATION_CACHE_PREFIX = "nfh_reputation_";
const REPUTATION_CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes

// Remove any cached reputation entries that have passed their TTL.
// Called on each reputation fetch so cleanup is naturally periodic.
function sweepStaleReputationCache() {
  const now = Date.now();
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(REPUTATION_CACHE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      if (
        !parsed ||
        !parsed.timestamp ||
        now - parsed.timestamp >= REPUTATION_CACHE_TTL_MS
      ) {
        keysToRemove.push(key);
      }
    } catch (e) {
      keysToRemove.push(key); // corrupt entry
    }
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

// Fetch reputation data for a player, using a per-player localStorage cache.
// Resolves with the data, or null when the fetch fails.
async function getReputationForPlayer(playerId) {
  sweepStaleReputationCache();

  const cacheKey = REPUTATION_CACHE_PREFIX + playerId;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (
        parsed &&
        parsed.timestamp &&
        Date.now() - parsed.timestamp < REPUTATION_CACHE_TTL_MS
      ) {
        LogInfo(`Reputation cache hit for player ${playerId}`);
        return parsed.data;
      }
    } catch (e) {
      // fall through to network fetch
    }
  }

  LogInfo(`Fetching reputation for player ${playerId}`);
  try {
    const data = await api("/reputation/" + playerId);
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
    LogInfo(`Reputation fetched for player ${playerId}:`, data);
    return data;
  } catch (error) {
    console.error("Error fetching reputation:", error);
    return null;
  }
}

// Build and insert the reputation section on a profile page.
// Fully async — fires the network request, then waits for the DOM element.
export async function checkAndInsertReputation() {
  if (!IsPage(PageType.Profile)) {
    return;
  }

  if (!SettingsManager.isReputationVisible()) {
    return;
  }

  const playerId = getPlayerId();
  if (!playerId) {
    return;
  }

  // Prevent duplicate insertion
  if (document.querySelector(".nfh-reputation")) {
    return;
  }

  const data = await getReputationForPlayer(playerId);
  if (!data) {
    return;
  }

  const elm = await waitForElm("div.profile-left-wrapper");
  // Guard against duplicate insertion if two calls raced
  if (document.querySelector(".nfh-reputation")) {
    return;
  }

  const outerDiv = document.createElement("div");
  outerDiv.classList.add("nfh-reputation", "nfh-section", "m-top10");

  const innerDiv = document.createElement("div");

  const title = document.createElement("p");
  title.innerText = "Nuke Family Reputation";
  title.classList.add("nfh-section-title", "title-black", "top-round");

  const container = document.createElement("div");
  container.classList.add("nfh-section-container");

  const list = document.createElement("ul");
  list.classList.add("nfh-section-list");

  const li = document.createElement("li");
  li.innerHTML = `<span class="nfh-list-key">Paid Revives:</span><span class="nfh-list-value"><strong>${escapeHtml(data.paid_revives_90d)}</strong> confirmed paid revive${data.paid_revives_90d !== 1 ? "s" : ""} (last ${escapeHtml(data.window_days)} days)</span>`;
  list.appendChild(li);

  container.appendChild(list);

  // Recruiting score button — only shown to users with the permission.
  maybeAddRecruitingButton(container, playerId);

  innerDiv.appendChild(title);
  innerDiv.appendChild(container);
  outerDiv.appendChild(innerDiv);

  // Insert after the first child of profile-left-wrapper (same as active
  // contract section)
  const firstChild = elm.firstChild;
  if (firstChild && firstChild.nextSibling) {
    elm.insertBefore(outerDiv, firstChild.nextSibling);
  } else {
    elm.appendChild(outerDiv);
  }

  LogInfo(
    `Reputation section injected for player ${playerId}: ${data.paid_revives_90d} paid revives`,
  );
}

export default {
  name: "reputation",
  pages: [PageType.Profile],
  init: checkAndInsertReputation,
};
