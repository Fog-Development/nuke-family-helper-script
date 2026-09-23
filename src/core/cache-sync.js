import { api } from "./api.js";
import { getApiToken } from "./auth.js";
import { LogInfo } from "./log.js";
import { refreshPermissions, refreshUserRole } from "./user.js";

const CACHE_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

const stores = [];

export function registerSyncedStore(store) {
  stores.push(store);
}

// Time-based TTL fallback: refresh any registered store whose cache is older
// than its own TTL.
function performTimeBasedCacheCheck() {
  const now = Date.now();
  for (const store of stores) {
    if (store.isStale(now)) {
      LogInfo(`${store.serverField}: cache expired (time-based), fetching...`);
      store.refresh();
    }
  }
}

// Unconditionally refetch everything the script caches: the registered
// synced stores (shitlist, categories, contracts) plus the user's role and
// permissions. Used by the "Check NFH Updates" button so it doubles as a
// manual "my data looks stale" escape hatch. Also clears the throttle so the
// next server-timestamp check isn't skipped.
export async function refreshAllCaches() {
  localStorage.removeItem("nfhLastApiCheckTime");
  LogInfo("Force-refreshing all caches...");
  await Promise.all([
    ...stores.map((store) => store.refresh()),
    refreshUserRole(),
    refreshPermissions(),
  ]);
  LogInfo("Force refresh complete.");
}

// Ask the server when each cached resource last changed and refresh only the
// stale ones. Throttled to one API call per 5 minutes; between checks (or on
// failure) the time-based fallback still runs.
export async function checkCacheUpdates() {
  if (!getApiToken()) {
    LogInfo("API token not available, skipping cache check.");
    performTimeBasedCacheCheck();
    return;
  }

  const now = Date.now();
  const lastApiCheckTimestamp = parseInt(
    localStorage.getItem("nfhLastApiCheckTime") || "0",
  );

  if (now - lastApiCheckTimestamp < CACHE_CHECK_INTERVAL) {
    LogInfo(
      `Skipping API cache check, last check was less than ${
        CACHE_CHECK_INTERVAL / 60000
      } minutes ago. Running time-based checks instead.`,
    );
    performTimeBasedCacheCheck();
    return;
  }

  LogInfo("Attempting API cache check (more than 5 minutes since last check).");
  try {
    const serverTimes = await api("/cache/last-updates");

    // Successfully checked; store the current time as the last check time.
    localStorage.setItem("nfhLastApiCheckTime", now.toString());
    LogInfo("Server timestamps:", serverTimes);

    for (const store of stores) {
      const serverTimestampSec = serverTimes[store.serverField];
      if (serverTimestampSec && serverTimestampSec * 1000 > store.timestamp) {
        LogInfo(`${store.serverField}: data is outdated, fetching new data.`);
        store.refresh(serverTimestampSec);
      }
    }

    // Also run the time-based checks so resources not covered by the server
    // timestamps still get refreshed periodically.
    performTimeBasedCacheCheck();
  } catch (error) {
    console.error("Cache check API request failed:", error);
    LogInfo("Cache check API request failed. Using time-based fallback.");
    // Don't update nfhLastApiCheckTime on failure.
    performTimeBasedCacheCheck();
  }
}
