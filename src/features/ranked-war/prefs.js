import { SortMode, Source, SOURCES, Then } from "./logic.js";

// Preferences for the ranked war board, kept in localStorage as one JSON
// object (this browser only).

const STORAGE_KEY = "nfhRankedWar";

const DEFAULTS = {
  sort: SortMode.Status,
  // How members with the same status are ordered among themselves.
  then: Then.ScoreDesc,
  showStats: true,
  // Whose estimate to use when both BSP's and FF Scouter's are known.
  source: Source.Bsp,
};

function sanitize(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    sort: Object.values(SortMode).includes(source.sort) ? source.sort : DEFAULTS.sort,
    then: Object.values(Then).includes(source.then) ? source.then : DEFAULTS.then,
    showStats: source.showStats !== false,
    source: SOURCES.includes(source.source) ? source.source : DEFAULTS.source,
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
