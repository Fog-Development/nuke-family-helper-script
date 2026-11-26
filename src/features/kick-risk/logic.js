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

// ---- leave risk, its reasons, and last online -----------------------------------

export function daysSince(iso, now = Date.now()) {
  if (!iso) return null;
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return null;
  return Math.max(0, Math.floor((now - at) / 86_400_000));
}

export function lastOnlineText(days) {
  if (days === null || days === undefined) return "unknown";
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

// Members away this long get a chip on the row whatever their kick risk.
export const AWAY_DAYS = 3;
export const GONE_DAYS = 7;

export function awayTier(days) {
  if (days === null || days === undefined || days < AWAY_DAYS) return null;
  return days >= GONE_DAYS ? "gone" : "away";
}

// "Time Online / day (7d) 12.5 · Xanax Taken / day (30d) 0.2"
export function reasonsText(reasons) {
  return (reasons || [])
    .filter((reason) => reason && reason.label)
    .map((reason) => {
      const value = number(reason.value);
      return value === null ? reason.label : `${reason.label} ${value}`;
    })
    .join(" · ");
}

// "↑ 12.5 since last week" / "↓ 3 since last week" / "" (new this week)
export function deltaText(delta) {
  if (delta === null || delta === undefined || !Number.isFinite(Number(delta))) return "";
  const n = Math.round(Number(delta) * 10) / 10;
  if (n === 0) return "no change since last week";
  return `${n > 0 ? "↑" : "↓"} ${Math.abs(n)} since last week`;
}
