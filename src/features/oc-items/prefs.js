import { getItem, setItem } from "../../core/storage.js";

// A staff member's own choice of what the OC items help shows them: each kind
// (missing items, loaned but not needed) in the OC Items panel and as tags on
// the armoury's rows. The faction's OC Assistant settings on nuke.family give
// the defaults (`staff.show`) and can switch a kind off for everyone
// (`staff.kinds`); anything the member changed wins over the defaults while
// they stay in that faction. Changed in the OC Assistant bar's Settings.

const KEY = "nfhOcItemShow";

export const ITEM_SHOW_KEYS = ["missing_panel", "missing_tags", "retrieve_panel", "retrieve_tags"];

// What a staff member's own choices are, as { factionId, choices }, or null.
function saved() {
  try {
    const value = JSON.parse(getItem(KEY) || "null");
    return value && typeof value === "object" && value.choices ? value : null;
  } catch (error) {
    return null;
  }
}

// The member's own changes for this faction ({} when none, or they were made in another faction).
export function ownItemChoices(factionId) {
  const pref = saved();
  return pref && pref.factionId === factionId ? pref.choices : {};
}

// What to show: the member's own choice, else the faction's default, never a
// kind the faction switched off. A site that sends no defaults shows all.
export function itemShow(staff, factionId) {
  const defaults = (staff && staff.show) || {};
  const kinds = (staff && staff.kinds) || {};
  const own = ownItemChoices(factionId);
  const result = {};
  for (const key of ITEM_SHOW_KEYS) {
    const kind = key.split("_")[0];
    if (kinds[kind] === false) {
      result[key] = false;
      continue;
    }
    result[key] = typeof own[key] === "boolean" ? own[key] : defaults[key] !== false;
  }
  return result;
}

export function setItemChoice(factionId, key, value) {
  const choices = { ...ownItemChoices(factionId), [key]: !!value };
  setItem(KEY, JSON.stringify({ factionId, choices }));
}

export function resetItemChoices() {
  setItem(KEY, "null");
}
