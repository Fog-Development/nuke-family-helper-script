import { belowMemberLevel, countsProductiveDays, describeWait, PLANNING_HOURS, productiveFromLevel } from "./scoring.js";

// Pure rules for what is wrong with a member's slot. Staff see these on every
// filled slot; a member is warned about their own. No DOM and no storage, so
// it is unit tested alongside scoring.js.

export const Flag = {
  Unqualified: "unqualified", // CPR below the faction's minimum for the role
  Unproductive: "unproductive", // planning will not start within the threshold
  UnderLevel: "underlevel", // could be doing crimes well above this one
};

export const FLAG_LABELS = {
  [Flag.Unqualified]: "Unqualified",
  [Flag.Unproductive]: "Not productive",
  [Flag.UnderLevel]: "Under-levelled",
};

// Hours until the member in slot `index` starts planning: the planning still
// owed by everyone who joined before them. Slots are in join order.
export function hoursUntilTurn(crime, index) {
  return crime.slots
    .slice(0, index)
    .filter((slot) => slot.occupied)
    .reduce((hours, slot) => hours + (1 - (slot.progress || 0)) * PLANNING_HOURS, 0);
}

// Hours until the whole crime is ready, empty slots included.
export function crimeHoursLeft(crime) {
  return crime.slots.reduce(
    (hours, slot) => hours + (slot.occupied ? 1 - (slot.progress || 0) : 1) * PLANNING_HOURS,
    0,
  );
}

// The flags on one filled slot, as [{ flag, text, title }].
//
// `rated` is the slot as scoring.js rated it (its `minCpr`), `memberLevel` the
// level the site places the occupant at (null when it does not know), and
// `limits` the thresholds to judge by: { thresholdHours, levelGap,
// productiveFromLevel }. Nobody is "not productive" in a crime below the
// level the faction counts productive days from.
export function slotFlags(crime, index, rated, memberLevel, limits) {
  const slot = crime.slots[index];
  if (!slot || !slot.occupied) return [];
  const flags = [];

  if (rated.minCpr !== null && slot.cpr !== null && slot.cpr < rated.minCpr) {
    flags.push({
      flag: Flag.Unqualified,
      text: `CPR ${slot.cpr} < ${rated.minCpr}`,
      title: `CPR ${slot.cpr} is below the faction's minimum of ${rated.minCpr} for this role.`,
    });
  }

  const wait = hoursUntilTurn(crime, index);
  if (countsProductiveDays(crime, limits.productiveFromLevel ?? 1) && wait > limits.thresholdHours) {
    flags.push({
      flag: Flag.Unproductive,
      text: `Idle ${Math.round(wait)}h`,
      title: `Planning for this slot starts ${describeWait(wait)}, later than the ${limits.thresholdHours} hour threshold.`,
    });
  }

  // Judged by the level the member is held to: a level 9 or 10 member in a
  // level 8 crime had no crime of their own level to ask for.
  if (belowMemberLevel(crime, memberLevel, limits.levelGap)) {
    flags.push({
      flag: Flag.UnderLevel,
      text: `Level ${memberLevel} member`,
      title: `This member qualifies for level ${memberLevel} crimes; this one is level ${crime.level}.`,
    });
  }

  return flags;
}

// The thresholds to judge by: the faction's, unless a staff member has set
// their own. A member's warning about their own slot always passes no prefs.
export function limitsFor(config, prefs = null) {
  const settings = (config && config.settings) || {};
  return {
    thresholdHours: (prefs && prefs.thresholdHours) ?? settings.productive_threshold_hours ?? 12,
    levelGap: (prefs && prefs.levelGap) ?? settings.under_level_gap ?? 2,
    // The faction's alone: where its pay is pooled is not a matter of taste.
    productiveFromLevel: productiveFromLevel(config),
  };
}
