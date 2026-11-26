// Recruiting score badges: the pure rules (no DOM, no build defines), unit tested.

// The four sub-scores, in the order the profile check lists them. Kick safety
// is the one the badge highlights: the model's best signal on real joiners.
export const SUB_SCORES = [
  { key: "activity", label: "Activity", short: "A" },
  { key: "kick_safety", label: "Kick safety", short: "KS", highlight: true },
  { key: "retention", label: "Retention", short: "R" },
  { key: "combat", label: "Combat", short: "C" },
];

// The profile check's traffic light, as a tier name for CSS.
export function scoreTier(score) {
  if (score === null || score === undefined || score === "" || Number.isNaN(Number(score))) return null;
  const n = Number(score);
  if (n >= 67) return "good";
  if (n >= 34) return "mid";
  return "low";
}

export function scoreText(score) {
  if (score === null || score === undefined || score === "" || Number.isNaN(Number(score))) return "—";
  return String(Math.round(Number(score)));
}

// What a badge shows: the composite, then each sub-score.
export function badgeParts(data) {
  return {
    composite: { text: scoreText(data.composite), tier: scoreTier(data.composite) },
    subs: SUB_SCORES.map((sub) => ({ ...sub, text: scoreText(data[sub.key]), tier: scoreTier(data[sub.key]) })),
  };
}

export function badgeTitle(data) {
  const subs = SUB_SCORES.map((sub) => `${sub.label} ${scoreText(data[sub.key])}`).join(" · ");
  const model = data.feature_set === "full" ? "full model" : "public model";
  return `Recruiting score ${scoreText(data.composite)}/100 · ${subs} (${model}). Click for the reasons.`;
}

// "Torn's Recruit Citizens" etc.: the lists "Score this page" is offered on,
// by URL. Null anywhere else.
export function bulkPageKind(href) {
  let url;
  try {
    url = new URL(href);
  } catch (error) {
    return null;
  }
  if (url.hostname !== "www.torn.com") return null;
  const path = url.pathname;
  const sid = url.searchParams.get("sid");
  if (path === "/bringafriend.php") return "recruit-citizens";
  if (path === "/halloffame.php") return "halloffame";
  if (path === "/page.php" && sid === "UserList") return "search";
  if (path === "/factions.php" && url.searchParams.get("step") === "profile") return "faction-profile";
  if (path === "/index.php" && url.searchParams.get("page") === "people") return "abroad";
  return null;
}

export function playerIdFromHref(href) {
  if (!href) return null;
  const match = /profiles\.php\?(?:[^#]*&)?XID=(\d+)/i.exec(href);
  return match ? Number(match[1]) : null;
}

// The players of a bulk lookup that still need asking for: on the page, not
// answered yet (a failed one may be asked again).
export function unscoredIds(ids, results) {
  return [...new Set(ids)].filter((id) => {
    const result = results.get(id);
    return !result || result.state === "failed";
  });
}

// Fold one answer from the site into what is known so far. Returns the new
// cursor (the highest finished result seen), for the next poll's `after`.
export function applyProgress(results, answer, cursor = 0) {
  let next = cursor;
  for (const result of answer.results || []) {
    results.set(result.player_id, result);
    if (result.seq > next) next = result.seq;
  }
  return next;
}

export function isFinished(status) {
  return status === "completed" || status === "failed";
}

// "Scoring 12 of 40…" / "Scored 40 players" / "Scored 38 of 40 (2 couldn't be read)"
export function progressText(lookup, results) {
  if (!lookup) return "";
  const failed = [...results.values()].filter((result) => result.state === "failed").length;
  if (!isFinished(lookup.status)) return `Scoring ${lookup.done} of ${lookup.total}…`;
  if (lookup.status === "failed") return `Stopped after ${lookup.done} of ${lookup.total}.`;
  return failed ? `Scored ${lookup.total - failed} of ${lookup.total} (${failed} couldn't be read).` : `Scored ${lookup.total} ${lookup.total === 1 ? "player" : "players"}.`;
}
