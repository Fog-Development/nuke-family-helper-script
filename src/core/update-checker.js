import { CURRENT_VERSION, GITHUB_URL } from "./config.js";
import { request } from "./api.js";
import { LogInfo } from "./log.js";

const CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
// How long a newer version must have been seen by the script before we bug the
// user with a manual-update prompt. Userscript managers (e.g. Tampermonkey)
// usually auto-update roughly daily, so we give that a few days to happen before
// nagging. The manual "Check NFH Updates" button bypasses this grace period.
const UPDATE_NOTIFY_GRACE_PERIOD = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds

export async function checkForUpdates(force = false) {
  const lastCheckTime = localStorage.getItem("nfhLastUpdateCheckTime");
  const currentTime = Date.now();

  if (!force && lastCheckTime && currentTime - lastCheckTime < CHECK_INTERVAL) {
    LogInfo(
      "Skipping update check, not enough time has passed since the last check and force update button not pressed",
    );
    return;
  }

  LogInfo("Checking for updates..." + lastCheckTime + " " + currentTime);

  // Update the last check time
  localStorage.setItem("nfhLastUpdateCheckTime", currentTime);

  let response;
  try {
    response = await request({ method: "GET", url: GITHUB_URL });
  } catch (error) {
    LogInfo("Update check failed:", error);
    return;
  }

  const match = response.responseText.match(/@version\s+([\d.]+)/);
  if (!match) {
    return;
  }

  const githubVersion = match[1];
  const isNewer = isVersionNewer(githubVersion, CURRENT_VERSION);
  if (isNewer) {
    // Only nag the user once the newer version has been around for a
    // while. The script manager typically auto-updates within a day or
    // so; if it hasn't after the grace period, the user's auto-updates
    // are likely off/broken and a manual prompt is warranted.
    // A forced check (the manual button) always prompts immediately.
    if (force || hasUpdateGracePeriodElapsed(githubVersion)) {
      if (
        confirm(
          "A new version of the Nuclear Family Helper script is available (v" +
            githubVersion +
            "). Do you want to update now?",
        )
      ) {
        window.location.href = GITHUB_URL;
      }
    } else {
      LogInfo(
        "New version " +
          githubVersion +
          " seen but still within the " +
          UPDATE_NOTIFY_GRACE_PERIOD / (24 * 60 * 60 * 1000) +
          "-day grace period; not prompting yet.",
      );
    }
  } else {
    // No newer version available; clear any pending-update record so a
    // future update starts its grace period fresh.
    localStorage.removeItem("nfhPendingUpdate");
    if (force) {
      alert(
        "No updates available. You are running version " +
          CURRENT_VERSION +
          ". And the latest published version is " +
          githubVersion +
          ".",
      );
    }
  }
}

// Tracks the first time the script saw a given newer version and reports
// whether the grace period has elapsed since then. Returns true once the
// newer version has been seen for longer than UPDATE_NOTIFY_GRACE_PERIOD.
function hasUpdateGracePeriodElapsed(githubVersion) {
  const now = Date.now();
  let pending = null;
  try {
    pending = JSON.parse(localStorage.getItem("nfhPendingUpdate"));
  } catch (e) {
    pending = null;
  }

  // First time we've seen this particular version (or no/invalid record):
  // start the clock and don't prompt yet.
  if (!pending || pending.version !== githubVersion) {
    localStorage.setItem(
      "nfhPendingUpdate",
      JSON.stringify({ version: githubVersion, firstSeen: now }),
    );
    return false;
  }

  return now - pending.firstSeen >= UPDATE_NOTIFY_GRACE_PERIOD;
}

// Compare version strings (e.g. "2.10.0" > "2.9.1")
function isVersionNewer(v1, v2) {
  const v1Parts = v1.split(".").map(Number);
  const v2Parts = v2.split(".").map(Number);
  const len = Math.max(v1Parts.length, v2Parts.length);

  for (let i = 0; i < len; i++) {
    const v1Part = i < v1Parts.length ? v1Parts[i] : 0;
    const v2Part = i < v2Parts.length ? v2Parts[i] : 0;
    if (v1Part > v2Part) return true;
    if (v1Part < v2Part) return false;
  }
  return false; // Versions are equal
}
