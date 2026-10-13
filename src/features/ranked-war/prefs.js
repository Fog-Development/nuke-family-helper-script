import { SortMode } from "./logic.js";

// Preferences for the ranked war board, kept in localStorage as one JSON
// object (this browser only).

const STORAGE_KEY = "nfhRankedWar";

const DEFAULTS = {
  sort: SortMode.Status,
  showStats: true,
};

function sanitize(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    sort: Object.values(SortMode).includes(source.sort) ? source.sort : DEFAULTS.sort,
    showStats: source.showStats !== false,
  };
}

let prefs = null;

export function getPrefs() {
  if (prefs) return prefs;

  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch (e) {
    // Corrupt entry: fall back to defaults.
  }
  prefs = sanitize(stored);
  return prefs;
}

export function setPrefs(patch) {
  prefs = sanitize({ ...getPrefs(), ...patch });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  return prefs;
}
