import { promptForNewApiKey } from "../core/auth.js";
import { refreshAllCaches } from "../core/cache-sync.js";
import { ensureInjected } from "../core/dom.js";
import { LogInfo } from "../core/log.js";
import { PageType } from "../core/pages.js";
import { checkForUpdates } from "../core/update-checker.js";
import { refreshPermissions, refreshUserRole } from "../core/user.js";

// "Change Nuke Family Key" + "Check NFH Updates" buttons on the faction
// controls page. This is the script's only settings surface outside the
// profile-page cog, so the first-run token alert points users here.
const CONTAINER_SELECTOR = "#faction-controls > hr";
const CHANGE_KEY_ID = "nfh-change-key-btn";
const CHECK_UPDATES_ID = "nfh-check-updates-btn";

function buildChangeKeyButton() {
  const btn = document.createElement("button");
  btn.id = CHANGE_KEY_ID;
  btn.innerHTML = "Change Nuke Family Key";
  btn.classList.add("torn-btn");
  btn.addEventListener("click", function () {
    const newKey = promptForNewApiKey();
    if (newKey) {
      refreshUserRole();
      refreshPermissions();
      alert("Nuke Family key updated. It will be used for all future requests.");
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
    // role and permissions) so this button doubles as a "fix my stale data"
    // escape hatch, then check for a script update.
    try {
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
      LogInfo("Faction control buttons inserted");
    },
  });
}

export default {
  name: "faction-buttons",
  pages: [PageType.FactionControl],
  init,
};
