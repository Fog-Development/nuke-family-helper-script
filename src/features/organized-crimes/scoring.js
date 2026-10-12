import { findRole } from "./catalog.js";

// Pure slot rating: no DOM, so it can be unit tested. Takes crimes as
// page.js reads them (only `name`, `level` and each slot's `name`, `cpr`,
// `occupied`, `progress` are used) and the faction's config.

// Torn plans one member at a time, in the order they joined, 24 hours each.
export const PLANNING_HOURS = 24;

export const SlotStatus = {
  Filled: "filled", // someone is in it
  Eligible: "eligible", // open, and the viewer meets the minimum
  Below: "below", // open, but the viewer's CPR is under the minimum
  Unrated: "unrated", // open, but the site has no minimum for it
};

export const Rank = { Best: "best", Good: "good" };

// How many "Good" slots are marked beside the best one.
const GOOD_SLOTS = 2;

// Hours until a member joining now would start planning: the planning still
// owed by everyone already in the crime. Zero for an empty crime, and for
// one whose members have all finished and which is only waiting on a slot.
export function hoursUntilPlanning(crime) {
  return crime.slots
    .filter((slot) => slot.occupied)
    .reduce((hours, slot) => hours + (1 - (slot.progress || 0)) * PLANNING_HOURS, 0);
}

function rateSlot(slot, crime, config) {
  const role = findRole(config, crime.name, slot.name);
  const minCpr = role ? role.min_cpr : null;
  const weight = role && role.weight !== null && role.weight !== undefined ? role.weight : null;

  let status;
  if (slot.occupied) status = SlotStatus.Filled;
  else if (minCpr === null || slot.cpr === null) status = SlotStatus.Unrated;
  else status = slot.cpr >= minCpr ? SlotStatus.Eligible : SlotStatus.Below;

  return { slot, minCpr, weight, status };
}

// The one slot of a crime worth recommending: the heaviest role the member
// qualifies for. Role minimums rise with weight, so this leaves the light
// roles for members who cannot fill the heavy ones.
function pickSlot(ratedSlots) {
  return ratedSlots
    .filter((rated) => rated.status === SlotStatus.Eligible)
    .sort((a, b) => (b.weight ?? -1) - (a.weight ?? -1) || b.slot.cpr - a.slot.cpr)[0] || null;
}

// Rate every slot and choose what to suggest.
//
// Returns { crimes: [{ crime, waitHours, productive, slots: [rated] }],
//           suggestions: [{ rank, crime, rated, waitHours, productive }] }
// with `suggestions` best first. A candidate is one slot per crime; they are
// ordered by: planning starts within the faction's productive threshold,
// then crime level (highest first), then the wait (shortest first), then
// role weight (heaviest first).
export function rateCrimes(crimes, config) {
  const settings = (config && config.settings) || {};
  const threshold = settings.productive_threshold_hours ?? 12;
  const levelGap = settings.under_level_gap ?? 2;

  const rated = crimes.map((crime) => {
    const waitHours = hoursUntilPlanning(crime);
    return {
      crime,
      waitHours,
      productive: waitHours <= threshold,
      slots: crime.slots.map((slot) => rateSlot(slot, crime, config)),
    };
  });

  const candidates = rated
    .map((entry) => ({ ...entry, pick: pickSlot(entry.slots) }))
    .filter((entry) => entry.pick)
    .sort(
      (a, b) =>
        Number(b.productive) - Number(a.productive) ||
        (b.crime.level ?? 0) - (a.crime.level ?? 0) ||
        a.waitHours - b.waitHours ||
        (b.pick.weight ?? -1) - (a.pick.weight ?? -1),
    );

  const suggestions = [];
  const best = candidates[0];
  if (best) {
    suggestions.push(suggestion(Rank.Best, best));
    // "Good" means nearly as good: as productive as the best, and not so far
    // below its level that staff would call the crime too easy.
    const lowestGoodLevel = (best.crime.level ?? 0) - (levelGap - 1);
    for (const candidate of candidates.slice(1)) {
      if (suggestions.length > GOOD_SLOTS) break;
      if (candidate.productive !== best.productive) continue;
      if ((candidate.crime.level ?? 0) < lowestGoodLevel) continue;
      suggestions.push(suggestion(Rank.Good, candidate));
    }
  }

  return { crimes: rated, suggestions };
}

function suggestion(rank, candidate) {
  return {
    rank,
    crime: candidate.crime,
    rated: candidate.pick,
    waitHours: candidate.waitHours,
    productive: candidate.productive,
  };
}

// "now", "in about 3 hours", "in about 2 days".
export function describeWait(hours) {
  if (hours < 0.5) return "now";
  if (hours < 36) {
    const rounded = Math.max(1, Math.round(hours));
    return `in about ${rounded} hour${rounded === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `in about ${days} days`;
}
