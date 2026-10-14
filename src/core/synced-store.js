import { LogInfo } from "./log.js";

// A localStorage-backed data store that can be refreshed either from the
// server's /cache/last-updates timestamps (see cache-sync.js) or by a
// time-based TTL fallback. The storageKey / dataField pairs match the
// pre-refactor localStorage layout so existing installs keep their cache.
export function createSyncedStore({
  storageKey,
  dataField,
  emptyValue,
  serverField,
  fallbackTtlMs,
  fetcher,
  // Whether anything uses the store right now. While false it is never
  // fetched; its old copy goes stale, so it is fetched once it is wanted again.
  enabled = () => true,
}) {
  let data = emptyValue;
  let timestamp = 0;
  const listeners = [];

  const store = {
    storageKey,
    serverField,
    fallbackTtlMs,

    get data() {
      return data;
    },
    get timestamp() {
      return timestamp;
    },

    // Register a callback invoked with the fresh data after every successful
    // refresh. Several features can listen to one store (e.g. the profile
    // page and hospital rows both render the shitlist); registering after
    // construction avoids circular imports between data and UI modules.
    subscribe(listener) {
      listeners.push(listener);
    },

    // Load previously cached data from localStorage. Corrupt entries are
    // discarded (the next refresh repopulates them) instead of alerting.
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
        if (saved && typeof saved === "object") {
          data = saved[dataField] ?? emptyValue;
          timestamp = saved.timestamp || 0;
        }
      } catch (error) {
        console.error(`Error loading cached ${storageKey}:`, error);
        localStorage.removeItem(storageKey);
      }
      LogInfo(`Loaded ${storageKey} from cache:`, data);
    },

    isStale(now = Date.now()) {
      return !timestamp || now - timestamp > fallbackTtlMs;
    },

    // Fetch fresh data. When triggered by a server timestamp mismatch the
    // server's timestamp (seconds) is stored so future comparisons line up;
    // otherwise the current time is used (time-based fallback).
    async refresh(serverTimestampSec = null) {
      if (!enabled()) {
        LogInfo(`${storageKey} not in use, not fetched`);
        return;
      }
      try {
        data = await fetcher();
        timestamp = serverTimestampSec ? serverTimestampSec * 1000 : Date.now();
        localStorage.setItem(
          storageKey,
          JSON.stringify({ [dataField]: data, timestamp }),
        );
        LogInfo(`${storageKey} updated and stored with timestamp:`, timestamp);
        for (const listener of listeners) {
          try {
            listener(data);
          } catch (error) {
            console.error(`Listener for ${storageKey} failed:`, error);
          }
        }
      } catch (error) {
        console.error(`Error refreshing ${storageKey}:`, error);
      }
    },
  };

  return store;
}
