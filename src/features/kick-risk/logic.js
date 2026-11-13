// Kick risk on the Members list: the pure rules (no DOM), unit tested.

// The faction monitor's own tiers for its Kick Risk badge.
export function riskTier(kick) {
  if (kick === null || kick === undefined) return null;
  if (kick >= 35) return "high";
  if (kick >= 25) return "moderate";
  if (kick >= 15) return "elevated";
  return "low";
}

export const REASON_LIMIT = 200; // Torn's public kick reason
export const NEW_MEMBER_DAYS = 100;

const SHORT = {
  avg_daily_energy_spend_7: "avgE7",
  avg_daily_energy_spend_30: "avgE30",
  average_daily_xanax_taken_30_days: "xanDaily",
};

function number(value) {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n) >= 10 || Number.isInteger(n) ? String(Math.round(n)) : String(Math.round(n * 10) / 10);
}

function part(stat) {
  const label = SHORT[stat.key] || String(stat.label || stat.key).replace(/\s+/g, "");
  const value = number(stat.value) ?? (stat.shown ? String(stat.shown).replace(/\s+/g, " ").trim() : null);
  return value === null ? null : `${label}(${value})`;
}

// "Failing to meet faction standards - avgE7(120), avgE30(422), xanDaily(1.2), crimes7(4), days(45)"
// Energy and xanax always; then each figure under the faction's targets; then
// days in the faction when they are few. Kept within Torn's 200 characters by
// leaving off the last figures first.
export function kickReason(member) {
  const lead = "Failing to meet faction standards - ";
  const always = (member.stats || []).map(part).filter(Boolean);
  const missed = (member.missed || []).map(part).filter(Boolean);
  const days = member.days_in_faction;
  let tail = days !== null && days !== undefined && days < NEW_MEMBER_DAYS ? [`days(${Math.round(days)})`] : [];
  const text = () => lead + [...always, ...missed, ...tail].join(", ");
  while (missed.length && text().length > REASON_LIMIT) missed.pop();
  if (text().length > REASON_LIMIT) tail = [];
  return text().slice(0, REASON_LIMIT);
}

// "↓ 23%" / "↑ 8%" / "" for avgE7 against avgE30.
export function changeText(percent) {
  if (percent === null || percent === undefined) return "";
  if (percent === 0) return "± 0%";
  return `${percent < 0 ? "↓" : "↑"} ${Math.abs(percent)}%`;
}

export function formatStat(stat) {
  const value = number(stat.value);
  return value === null ? stat.shown || "—" : value;
}
