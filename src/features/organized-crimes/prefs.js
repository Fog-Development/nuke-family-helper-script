import { getItem, setItem } from "../../core/storage.js";
import { Flag } from "./flags.js";

// A staff member's own choices for the OC flags: which kinds to show, and
// their own thresholds where they differ from the faction's (null = use the
// faction's). Kept in this browser only.

const KEY = "nfhOcStaffPrefs";

const DEFAULTS = {
  show: { [Flag.Unqualified]: true, [Flag.Unproductive]: true, [Flag.UnderLevel]: true },
  thresholdHours: null,
  levelGap: null,
};

export function getStaffPrefs() {
  let saved = null;
  try {
    saved = JSON.parse(getItem(KEY) || "null");
  } catch (e) {
    saved = null;
  }
  return {
    ...DEFAULTS,
    ...(saved || {}),
    show: { ...DEFAULTS.show, ...((saved && saved.show) || {}) },
  };
}

export function setStaffPrefs(changes) {
  const next = { ...getStaffPrefs(), ...changes };
  setItem(KEY, JSON.stringify(next));
  return next;
}

// A member's own choice to show or hide role weights, as { show, factionId },
// or null to follow the faction (see weightsChoice in scoring.js).
const WEIGHTS_KEY = "nfhOcWeights";

export function getWeightsPref() {
  try {
    return JSON.parse(getItem(WEIGHTS_KEY) || "null");
  } catch (e) {
    return null;
  }
}

export function setWeightsPref(pref) {
  setItem(WEIGHTS_KEY, pref === null ? "null" : JSON.stringify(pref));
}

// A threshold typed into the settings: a whole number in range, or null
// (blank, or nonsense) to go back to the faction's.
export function parseOverride(value, min, max) {
  const number = parseInt(value, 10);
  if (Number.isNaN(number)) return null;
  return Math.min(max, Math.max(min, number));
}
