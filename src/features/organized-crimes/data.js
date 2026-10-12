import { api, ApiError } from "../../core/api.js";
import { createSyncedStore } from "../../core/synced-store.js";

// The faction's OC Assistant config from nuke.family (/oc/config): its
// thresholds and, for every crime, each role's weight and minimum CPR. The
// site bumps `oc_config_cache_last_update` whenever staff change a setting or
// the weights are re-synced, so this is refetched only when something moved.
export const ocConfigStore = createSyncedStore({
  storageKey: "nfhOcConfig",
  dataField: "config",
  emptyValue: null,
  serverField: "oc_config_cache_last_update",
  fallbackTtlMs: 6 * 60 * 60 * 1000, // 6 hours
  fetcher: async () => {
    try {
      return (await api("/oc/config")).data || null;
    } catch (error) {
      // Not in a Nuke Family faction: there is no config, and that is not an
      // error worth reporting on every refresh.
      if (error instanceof ApiError && error.status === 403) return null;
      throw error;
    }
  },
});
