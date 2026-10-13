import { getItem, setItem } from "../../core/storage.js";

// Preferences for the chain watch bar and the chain timer alert, kept in
// localStorage as one JSON object.

const STORAGE_KEY = "nfhChainWatch";
// Settings of the old standalone "Chain watcher" userscript (the typo is
// theirs). Imported once so people switching over keep their alert setup.
const LEGACY_KEY = "chainWarcher";

// When the chain timer alert is armed. Always is the default because that is
// what the old script did: people rely on it for chains that have no chain
// watch on nuke.family at all.
export const AlertMode = {
  Always: "always", // any active chain
  Watch: "watch", // only while the faction has a chain watch set up
  CheckedIn: "checkedin", // as Watch, and only once checked in to it
  Off: "off",
};

// Flash period (and time between beeps) in milliseconds.
export const PACES = { fast: 1000, normal: 2000, slow: 4000 };

export const MAX_ALERT_SECONDS = 299; // Torn's chain timer tops out at 5:00

const DEFAULTS = {
  expanded: false,
  alertMode: AlertMode.Always,
  alertSeconds: 150,
  beep: false,
  volume: 0.5,
  color: "#ff0000",
  opacity: 0.2,
  pace: "normal",
  markWall: false,
  dmReminder: true,
};

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

// Coerce whatever was stored into a complete, valid preferences object.
function sanitize(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    expanded: source.expanded === true,
    alertMode: Object.values(AlertMode).includes(source.alertMode)
      ? source.alertMode
      : DEFAULTS.alertMode,
    alertSeconds: Math.round(
      clamp(source.alertSeconds, 1, MAX_ALERT_SECONDS, DEFAULTS.alertSeconds),
    ),
    beep: source.beep === true,
    volume: clamp(source.volume, 0.01, 1, DEFAULTS.volume),
    color: /^#[0-9a-f]{6}$/i.test(source.color) ? source.color : DEFAULTS.color,
    opacity: clamp(source.opacity, 0.05, 1, DEFAULTS.opacity),
    pace: source.pace in PACES ? source.pace : DEFAULTS.pace,
    markWall: source.markWall === true,
    dmReminder: source.dmReminder !== false,
  };
}

function importLegacy() {
  let legacy;
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
  } catch (e) {
    return null;
  }
  if (!legacy || typeof legacy !== "object") return null;

  // The old script toggled the flash every `interval` ms, so a full flash
  // took twice that.
  const period = (Number(legacy.interval) || 1000) * 2;
  return {
    alertMode: legacy.watchChain === false ? AlertMode.Off : AlertMode.Always,
    alertSeconds:
      (Number(legacy.minuteAlert) || 0) * 60 + (Number(legacy.secundeAlert) || 0),
    beep: legacy.beepAlert === true,
    volume: legacy.beepVolume,
    color: legacy.color,
    opacity: legacy.opacity,
    pace: period <= 1000 ? "fast" : period <= 2000 ? "normal" : "slow",
    markWall: legacy.markWallTargets !== false,
  };
}

let prefs = null;

export function getPrefs() {
  if (prefs) return prefs;

  let stored = null;
  try {
    stored = JSON.parse(getItem(STORAGE_KEY) || "null");
  } catch (e) {
    // Corrupt entry: fall back to defaults.
  }
  prefs = sanitize(stored || importLegacy());
  return prefs;
}

export function setPrefs(patch) {
  prefs = sanitize({ ...getPrefs(), ...patch });
  setItem(STORAGE_KEY, JSON.stringify(prefs));
  return prefs;
}

// "2:30" <-> 150
export function formatAlertTime(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function parseAlertTime(text) {
  const match = String(text).trim().match(/^(\d):([0-5]\d)$/);
  if (!match) return null;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return seconds >= 1 && seconds <= MAX_ALERT_SECONDS ? seconds : null;
}
