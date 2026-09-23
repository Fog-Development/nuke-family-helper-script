import { api } from "../../core/api.js";
import { createSyncedStore } from "../../core/synced-store.js";

// Shitlist entries, keyed "f{factionId}#{entryId}" for faction bans and
// "p{playerId}#{entryId}" for player entries.
export const shitlistStore = createSyncedStore({
  storageKey: "shitListEntriesList",
  dataField: "shitListEntries",
  emptyValue: {},
  serverField: "shitlist_cache_last_update",
  fallbackTtlMs: 720 * 60 * 1000, // 12 hours
  fetcher: async () => {
    const responseEntries = (await api("/shit-lists"))["data"];
    const toSave = {};
    responseEntries.forEach((entry) => {
      const obj = {
        entryId: entry.id,
        playerName: entry.playerName,
        playerId: entry.playerId,
        factionId: entry.factionId,
        factionName: entry.factionName,
        isFactionBan: entry.isFactionBan,
        isApproved: entry.isApproved,
        shitListCategoryId: entry.shitListCategoryId,
        reason: entry.reason,
        updatedAt: entry.updated_at,
        shitListCategory: entry.shitListCategory,
      };

      if (entry.isFactionBan) toSave["f" + entry.factionId + "#" + entry.id] = obj;
      else toSave["p" + entry.playerId + "#" + entry.id] = obj;
    });
    return toSave;
  },
});

// Shitlist categories, keyed by category id.
export const categoriesStore = createSyncedStore({
  storageKey: "shitListCategoriesList",
  dataField: "shitListCategories",
  emptyValue: {},
  serverField: "shitlist_category_cache_last_update",
  fallbackTtlMs: 720 * 60 * 1000, // 12 hours
  fetcher: async () => {
    const responseEntries = (await api("/shit-list-categories"))["data"];
    const toSave = {};
    responseEntries.forEach((entry) => {
      toSave[entry.id] = {
        entryId: entry.id,
        name: entry.name,
        description: entry.description,
        isFactionBan: entry.is_faction,
        isFriendly: entry.is_friendly,
      };
    });
    return toSave;
  },
});
