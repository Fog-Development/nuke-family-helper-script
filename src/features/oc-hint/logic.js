// The "No OC" hint's rules (pure, unit tested): whether to show it, how loud,
// and what it says. `status` is the site's `/oc/me` answer's `data`.

// Someone whose crime has just ended isn't nagged: for this long the hint is
// grey, after that amber.
export const QUIET_SECONDS = 60 * 60;

// "25m", "5h", "2d": the whole units only, as the sidebar has no room for more.
export function idleLabel(seconds) {
  const minutes = Math.max(0, Math.floor(seconds / 60));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// null for no hint (in a crime, switched off by the faction, not known), or
// { tone: "quiet" | "warn", text, age, title } (`text` is "No OC · " + `age`).
export function hintFor(status, nowSeconds) {
  if (!status || status.enabled === false || status.state !== "idle" || !status.idle_since) return null;
  const idle = Math.max(0, nowSeconds - status.idle_since);
  const label = idleLabel(idle);
  return {
    tone: idle < QUIET_SECONDS ? "quiet" : "warn",
    text: `No OC · ${label}`,
    age: label,
    title: `You haven't been in an organized crime for ${label}. Open your faction's crimes to join one.`,
  };
}
