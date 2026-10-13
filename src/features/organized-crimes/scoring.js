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
  Unrated: "unrated", // open, but the viewer's CPR for it is not known
};

export const Rank = { Best: "best", Good: "good" };

// How many "Good" slots are marked beside the best one.
const GOOD_SLOTS = 2;

// What the faction lets its members see. Staff flags are not among these: a
// staff member switches those on and off for themselves. A site too old to
// send a switch has everything on. Minimum CPRs cannot be hidden while slots
// are suggested or warned about, since those are judged by them; with the
// whole assistant off, a role shows its weight and nothing else.
export function memberFeatures(config) {
  const settings = (config && config.settings) || {};
  const enabled = settings.assistant_enabled !== false;
  const suggest = enabled && settings.suggest_slots !== false;
  const warn = enabled && settings.warn_poor_slot !== false;
  return {
    enabled,
    suggest,
    warn,
    minimums: enabled && (suggest || warn || settings.show_min_cpr !== false),
    spawn: enabled && Boolean(settings.spawn_requests_enabled),
  };
}

const HIGHEST_LEVEL = 10;

// The lowest crime level at which the faction counts productive days (usually
// the lowest it pools pay for). Below it, how soon a member starts planning
// does not matter. A faction that never counts them gets a level no crime
// reaches; a site too old to say counted them everywhere.
export function productiveFromLevel(config) {
  const from = ((config && config.settings) || {}).productive_from_level;
  if (from === undefined) return 1;
  return from === null ? HIGHEST_LEVEL + 1 : from;
}

// A crime whose level is not known is taken to be a new, high one.
export function countsProductiveDays(crime, fromLevel) {
  return (crime.level ?? HIGHEST_LEVEL) >= fromLevel;
}

// Hours until a member joining now would start planning: the planning still
// owed by everyone already in the crime. Zero for an empty crime, and for
// one whose members have all finished and which is only waiting on a slot.
export function hoursUntilPlanning(crime) {
  return crime.slots
    .filter((slot) => slot.occupied)
    .reduce((hours, slot) => hours + (1 - (slot.progress || 0)) * PLANNING_HOURS, 0);
}

// The minimum to assume for a role of a crime the site has no entry for yet
// (one released so recently that no faction has spawned it): the site's
// per-level fallback. Null when even that is missing.
function fallbackMinimum(config, level) {
  const fallbacks = config && config.fallback_min_cpr;
  if (!fallbacks) return null;
  return fallbacks[level] ?? fallbacks.default ?? null;
}

function rateSlot(slot, crime, config) {
  const role = findRole(config, crime.name, slot.name);
  const minCpr = role ? role.min_cpr : fallbackMinimum(config, crime.level);
  const weight = role && role.weight !== null && role.weight !== undefined ? role.weight : null;

  let status;
  if (slot.occupied) status = SlotStatus.Filled;
  else if (minCpr === null || slot.cpr === null) status = SlotStatus.Unrated;
  else status = slot.cpr >= minCpr ? SlotStatus.Eligible : SlotStatus.Below;

  // `assumed`: nobody has set this minimum; it is only the level's fallback.
  return { slot, minCpr, weight, status, assumed: !role && minCpr !== null };
}

// The one slot of a crime worth recommending: the heaviest role the member
// qualifies for. Role minimums rise with weight, so this leaves the light
// roles for members who cannot fill the heavy ones. A crime too new to have
// weights falls back on the role the member is best at.
function pickSlot(ratedSlots) {
  return ratedSlots
    .filter((rated) => rated.status === SlotStatus.Eligible)
    .sort((a, b) => (b.weight ?? -1) - (a.weight ?? -1) || b.slot.cpr - a.slot.cpr)[0] || null;
}

// Whether a crime is so far below a member's level that staff would flag them
// for sitting in it (the same rule as the under-levelled flag). Never, when
// either level is not known.
export function belowMemberLevel(crime, memberLevel, levelGap) {
  if (memberLevel === null || memberLevel === undefined) return false;
  if (crime.level === null || crime.level === undefined) return false;
  return memberLevel - crime.level >= levelGap;
}

// Whether a crime is below what the member should be joining. A member whose
// own level is one the faction counts productive days at is held to that
// level exactly: anything under it costs the faction, so it is only ever a
// last resort. Below that level the looser under-level gap applies.
export function belowOwnLevel(crime, memberLevel, config) {
  if (memberLevel === null || memberLevel === undefined) return false;
  const settings = (config && config.settings) || {};
  const gap = memberLevel >= productiveFromLevel(config) ? 1 : settings.under_level_gap ?? 2;
  return belowMemberLevel(crime, memberLevel, gap);
}

// Whether the member may ask staff for a crime at all: their faction allows it
// (and has the assistant on) and they are at or above its minimum level.
export function canAskForCrime(memberLevel, config) {
  const settings = (config && config.settings) || {};
  if (!memberFeatures(config).spawn) return false;
  if (memberLevel === null || memberLevel === undefined) return false;
  return memberLevel >= (settings.spawn_request_min_level ?? 6);
}

// Rate every slot and choose what to suggest.
//
// `member` is the viewer, when the site has said: { level, canAsk }. A crime
// below their level (`belowOwnLevel`) is never "good for them": it may still
// come first, marked `belowLevel`, as the best there is. One so far below
// that staff would flag them in it is not suggested at all to a member who
// can ask staff for a crime instead (`withheld` counts those).
//
// Returns { crimes: [{ crime, waitHours, pooled, productive, slots: [rated] }],
//           suggestions: [{ rank, crime, rated, waitHours, pooled, productive, thresholdHours,
//                           belowLevel, memberLevel }],
//           withheld }
// with `suggestions` best first. A candidate is one slot per crime; they are
// ordered by: planning starts within the faction's productive threshold,
// then crime level (highest first), then crimes whose role weights are known
// before crimes too new to have any (those are judged on CPR and level
// alone, so they are still suggested, just after an equal crime we know more
// about), then the wait (shortest first), then role weight (heaviest first).
//
// `pooled` is whether productive days count at the crime's level. Where they
// do not, no wait is too long (`productive` is always true) and, in place of
// the shortest wait, the crime closest to full comes first: nothing is lost
// by waiting there, and it gets crimes finished rather than several left
// half filled.
export function rateCrimes(crimes, config, member = null) {
  const settings = (config && config.settings) || {};
  const threshold = settings.productive_threshold_hours ?? 12;
  const levelGap = settings.under_level_gap ?? 2;
  const fromLevel = productiveFromLevel(config);
  const memberLevel = member ? member.level : null;
  const holdBack = Boolean(member && member.canAsk);

  const rated = crimes.map((crime) => {
    const waitHours = hoursUntilPlanning(crime);
    const pooled = countsProductiveDays(crime, fromLevel);
    return {
      crime,
      waitHours,
      pooled,
      productive: !pooled || waitHours <= threshold,
      openSlots: crime.slots.filter((slot) => !slot.occupied).length,
      slots: crime.slots.map((slot) => rateSlot(slot, crime, config)),
    };
  });

  const qualifying = rated
    .map((entry) => ({
      ...entry,
      pick: pickSlot(entry.slots),
      thresholdHours: threshold,
      memberLevel,
      belowLevel: belowOwnLevel(entry.crime, memberLevel, config),
      tooLow: belowMemberLevel(entry.crime, memberLevel, levelGap),
    }))
    .filter((entry) => entry.pick);
  const withheld = holdBack ? qualifying.filter((entry) => entry.tooLow).length : 0;

  const candidates = qualifying
    .filter((entry) => !holdBack || !entry.tooLow)
    .sort(
      (a, b) =>
        Number(b.productive) - Number(a.productive) ||
        (b.crime.level ?? 0) - (a.crime.level ?? 0) ||
        Number(b.pick.weight !== null) - Number(a.pick.weight !== null) ||
        (a.pooled || b.pooled ? 0 : a.openSlots - b.openSlots) ||
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
      if (candidate.belowLevel) continue;
      if (candidate.productive !== best.productive) continue;
      if ((candidate.crime.level ?? 0) < lowestGoodLevel) continue;
      suggestions.push(suggestion(Rank.Good, candidate));
    }
  }

  return { crimes: rated, suggestions, withheld };
}

function suggestion(rank, candidate) {
  return {
    rank,
    crime: candidate.crime,
    rated: candidate.pick,
    waitHours: candidate.waitHours,
    pooled: candidate.pooled,
    productive: candidate.productive,
    thresholdHours: candidate.thresholdHours,
    belowLevel: candidate.belowLevel,
    memberLevel: candidate.memberLevel,
  };
}

// Torn spawns crimes in pairs of levels; staff pick the pair.
export function tierFor(level) {
  if (level <= 2) return "1-2";
  if (level <= 4) return "3-4";
  if (level <= 6) return "5-6";
  if (level <= 8) return "7-8";
  return "9-10";
}

// Whether to offer the member a "ask staff for a crime" button: their faction
// allows it (and has the assistant on), they are at or above its minimum level, and the best slot on
// offer (anywhere, loaded or not) is not a decent one for them. Decent means
// it starts within the productive threshold and is not below what they
// should be joining (`belowOwnLevel`). Returns the tier to ask for, or null.
export function spawnTierToRequest(suggestions, memberLevel, config) {
  if (!canAskForCrime(memberLevel, config)) return null;

  const best = suggestions[0];
  const decent = best && best.productive && !belowOwnLevel(best.crime, memberLevel, config);
  return decent ? null : tierFor(memberLevel);
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
