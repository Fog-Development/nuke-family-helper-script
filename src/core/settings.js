import { LogInfo } from "./log.js";
import { getItem, setItem } from "./storage.js";
import {
  cachedPermissions,
  inRevivingFaction,
  RECRUITING_PERMISSION,
} from "./user.js";

// Settings manager for user preferences (shitlist category visibility,
// reputation and active contract box visibility). Stored in localStorage, or
// TornPDA's own store (see storage.js).
export const SettingsManager = {
  getHiddenCategories: () => {
    try {
      return JSON.parse(
        getItem("hiddenShitlistCategories") || "[]",
      );
    } catch (e) {
      console.error("Error parsing hidden categories:", e);
      return [];
    }
  },

  setHiddenCategories: (hiddenIds) => {
    setItem("hiddenShitlistCategories", JSON.stringify(hiddenIds));
  },

  isCategoryVisible: (categoryId, isFaction) => {
    // Faction categories are always visible
    if (isFaction) return true;

    return !SettingsManager.getHiddenCategories().includes(String(categoryId));
  },

  toggleCategory: (categoryId, isVisible) => {
    const hidden = SettingsManager.getHiddenCategories();
    LogInfo("Hidden categories before toggle:", hidden);
    let updated;

    if (isVisible) {
      // Remove from hidden list
      updated = hidden.filter((id) => id !== categoryId);
    } else {
      // Add to hidden list if not already there
      if (!hidden.includes(String(categoryId))) {
        updated = [...hidden, String(categoryId)];
      } else {
        updated = hidden;
      }
    }

    SettingsManager.setHiddenCategories(updated);
    return updated;
  },

  // The "Nuke Family Reputation" box on profiles. It holds the "Check
  // Recruiting Score" button, so a member who may use that always gets it.
  // Anyone else chooses; until they do, it shows unless their faction is known
  // not to revive.
  isReputationLocked: () =>
    cachedPermissions()?.includes(RECRUITING_PERMISSION) === true,

  isReputationVisible: () => {
    if (SettingsManager.isReputationLocked()) return true;
    let stored = null;
    try {
      stored = getItem("nfhShowReputation");
    } catch (e) {
      // fall back to the default
    }
    if (stored !== null) return stored === "true";
    return inRevivingFaction() !== false;
  },

  setReputationVisible: (isVisible) => {
    setItem("nfhShowReputation", String(isVisible));
  },

  // The "Active Contract" box on profiles. A reviver needs it, so a member of a
  // reviving faction always gets it; anyone else gets it only if they turned
  // it on. Until the site has said which they are, it shows.
  isActiveContractLocked: () => inRevivingFaction() === true,

  isActiveContractVisible: () => {
    const reviving = inRevivingFaction();
    if (reviving !== false) return true;
    try {
      return getItem("nfhShowActiveContract") === "true";
    } catch (e) {
      return false;
    }
  },

  setActiveContractVisible: (isVisible) => {
    setItem("nfhShowActiveContract", String(isVisible));
  },
};
