import { getItem, setItem } from "../../core/storage.js";

// Retal alert settings, this browser only, kept as one JSON object.

const STORAGE_KEY = "nfhRetals";

const DEFAULTS = {
  show: true, // the list, and reporting what this browser sees
  notify: true, // a toast for each new retal
  sound: false, // one chime with the toast
  volume: 0.5,
  desktop: false, // a desktop notification as well (where the browser allows it)
  minSeconds: 30, // a retal with less time left than this is not announced
};

export const MAX_MIN_SECONDS = 240;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sanitize(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    show: source.show !== false,
    notify: source.notify !== false,
    sound: source.sound === true,
    volume: clamp(source.volume, 0.05, 1, DEFAULTS.volume),
    desktop: source.desktop === true,
    minSeconds: Math.round(clamp(source.minSeconds, 0, MAX_MIN_SECONDS, DEFAULTS.minSeconds)),
  };
}

let prefs = null;

export function getPrefs() {
  if (prefs) return prefs;
  let stored = null;
  try {
    stored = JSON.parse(getItem(STORAGE_KEY) || "null");
  } catch (e) {
    // Corrupt entry: defaults.
  }
  prefs = sanitize(stored);
  return prefs;
}

export function setPrefs(patch) {
  prefs = sanitize({ ...getPrefs(), ...patch });
  setItem(STORAGE_KEY, JSON.stringify(prefs));
  return prefs;
}
