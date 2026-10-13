import { refreshAllCaches } from "../core/cache-sync.js";
import { ensureInjected } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { PageType } from "../core/pages.js";
import { checkForUpdates } from "../core/update-checker.js";
import { refreshPermissions, refreshUserRole } from "../core/user.js";
import { clearChainWatchCache } from "./chain-watch/data.js";
import { enterKeyByHand } from "./connect.js";
import { collectDebugInfo, showDebugInfo } from "./debug-info.js";

// "Change Nuke Family Key", "Check NFH Updates" and "NFH Debug Info" buttons
// on the faction controls page. This is the script's only settings surface outside the
// profile-page cog. Connecting normally needs no key typed anywhere (see connect.js);
// "Change Nuke Family Key" is the by-hand way, for when that does not work.
const CONTAINER_SELECTOR = "#faction-controls > hr";
const CHANGE_KEY_ID = "nfh-change-key-btn";
const CHECK_UPDATES_ID = "nfh-check-updates-btn";
const DEBUG_INFO_ID = "nfh-debug-info-btn";

function buildChangeKeyButton() {
  const btn = document.createElement("button");
  btn.id = CHANGE_KEY_ID;
  btn.innerHTML = "Change Nuke Family Key";
  btn.classList.add("torn-btn");
  btn.addEventListener("click", async function () {
    if (await enterKeyByHand()) {
      refreshUserRole();
      refreshPermissions();
    }
  });
  return btn;
}

function buildCheckUpdatesButton() {
  const btn = document.createElement("button");
  btn.id = CHECK_UPDATES_ID;
  btn.innerHTML = "Check NFH Updates";
  btn.classList.add("torn-btn");
  btn.addEventListener("click", async function () {
    btn.disabled = true;
    const originalLabel = btn.innerHTML;
    btn.innerHTML = "Refreshing…";

    // Force-refresh every cached resource (shitlist, categories, contracts,
    // role and permissions; the chain watch cache is just dropped) so this
    // button doubles as a "fix my stale data" escape hatch, then check for a
    // script update.
    try {
      clearChainWatchCache();
      await refreshAllCaches();
      LogInfo("All caches force-refreshed from the update button");
    } catch (error) {
      console.error("Error refreshing caches:", error);
    }

    btn.disabled = false;
    btn.innerHTML = originalLabel;

    // Bypasses the 6h throttle and the update-nag grace period.
    checkForUpdates(true);
  });
  return btn;
}

// A report of what the script has stored and what nuke.family answers to this
// member's key, for them to copy to whoever is helping them.
function buildDebugInfoButton() {
  const btn = document.createElement("button");
  btn.id = DEBUG_INFO_ID;
  btn.innerHTML = "NFH Debug Info";
  btn.classList.add("torn-btn");
  btn.addEventListener("click", async function () {
    btn.disabled = true;
    const originalLabel = btn.innerHTML;
    btn.innerHTML = "Collecting…";
    try {
      showDebugInfo(await collectDebugInfo());
    } catch (error) {
      console.error("Error collecting debug info:", error);
      showDebugInfo({ error: String(error) });
    }
    btn.disabled = false;
    btn.innerHTML = originalLabel;
  });
  return btn;
}

function init() {
  // Guard on DOM presence rather than a module flag: Torn rebuilds the
  // controls panel when you navigate away and back, which removes our
  // buttons while a "already inserted" flag would stay set.
  ensureInjected({
    containerSelector: CONTAINER_SELECTOR,
    isPresent: () => !!document.getElementById(CHANGE_KEY_ID),
    inject: (container) => {
      container.appendChild(buildChangeKeyButton());
      container.appendChild(buildCheckUpdatesButton());
      container.appendChild(buildDebugInfoButton());
      LogInfo("Faction control buttons inserted");
    },
  });
}

export default {
  name: "faction-buttons",
  pages: [PageType.FactionControl],
  init,
};
