import { LogInfo } from "./log.js";

// Settings manager for user preferences (shitlist category visibility,
// reputation box visibility). Stored in localStorage.
export const SettingsManager = {
  getHiddenCategories: () => {
    try {
      return JSON.parse(
        localStorage.getItem("hiddenShitlistCategories") || "[]",
      );
    } catch (e) {
      console.error("Error parsing hidden categories:", e);
      return [];
    }
  },

  setHiddenCategories: (hiddenIds) => {
    localStorage.setItem("hiddenShitlistCategories", JSON.stringify(hiddenIds));
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

  isReputationVisible: () => {
    try {
      const stored = localStorage.getItem("nfhShowReputation");
      // Default to true (enabled) if not set
      return stored === null ? true : stored === "true";
    } catch (e) {
      return true;
    }
  },

  setReputationVisible: (isVisible) => {
    localStorage.setItem("nfhShowReputation", String(isVisible));
  },
};
