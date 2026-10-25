// Pure rules for retal alerts (unit tested in test/unit/, so nothing here may
// need the browser or build defines).

// Torn allows a retaliation this long after the incoming hit.
export const WINDOW_SECONDS = 300;

// The member's own faction: Torn says so beside the feed, and failing that it
// is the faction of whoever is on our side of the latest attack.
export function feedFactionId(feed) {
  const stated = Number(feed && feed.userFactionID);
  if (stated > 0) return stated;

  const attacks = (feed && feed.recentAttacks) || [];
  const users = (feed && feed.users) || {};
  for (const attack of attacks) {
    const ours = users[attack.firstUserID];
    if (ours && Number(ours.factionID) > 0) return Number(ours.factionID);
  }
  return null;
}

function idOrNull(value) {
  const id = Number(value);
  return id > 0 ? id : null;
}

function textOrNull(value) {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// One of Torn's recent attacks in the shape the site takes. A stealthed
// attacker has no id, or Torn says it was stealthed: either way it is stealth.
export function normalizeAttack(attack, users = {}) {
  const attackerId = idOrNull(attack.attackerID);
  const attacker = (attackerId && users[attackerId]) || {};
  const defender = users[attack.defenderID] || {};

  return {
    id: String(attack.publicID),
    attacker_id: attackerId,
    attacker_name: textOrNull(attacker.playername),
    attacker_faction_id: idOrNull(attacker.factionID),
    attacker_faction_tag: textOrNull(attacker.factiontag),
    defender_id: Number(attack.defenderID),
    defender_name: textOrNull(defender.playername),
    defender_faction_id: idOrNull(defender.factionID),
    finished_at: Math.floor(Number(attack.finishTimestamp) / 1000),
    respect: Number(attack.respect) || 0,
    result: textOrNull(attack.result),
    stealth: Number(attack.stealthAttack) !== 0 || attackerId === null,
    retal: Number(attack.retal) === 1,
  };
}

// Whether the site would do anything with this attack: an enemy taking respect
// off one of our members without stealth (opens a retal), or one of our
// members' hits Torn counted as a retal (completes one). Everything else is
// left out of the report, so most feed updates send nothing.
export function matters(attack, factionId) {
  const incoming =
    attack.defender_faction_id === factionId &&
    attack.attacker_faction_id !== factionId &&
    !attack.stealth &&
    attack.respect < 0;
  const retalDone = attack.attacker_faction_id === factionId && attack.retal;
  return incoming || retalDone;
}

// The attacks worth reporting from one feed update: ones in the window, not
// already sent, that matter. `sent` is a Set of attack ids.
export function attacksToReport(feed, factionId, sent, nowSeconds) {
  const users = (feed && feed.users) || {};
  return ((feed && feed.recentAttacks) || [])
    .filter((attack) => attack && attack.publicID && !sent.has(String(attack.publicID)))
    .map((attack) => normalizeAttack(attack, users))
    .filter((attack) => attack.finished_at > nowSeconds - WINDOW_SECONDS)
    .filter((attack) => matters(attack, factionId));
}

// "4:05" for a countdown in seconds; never negative.
export function formatLeft(seconds) {
  const left = Math.max(0, Math.floor(seconds));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
}

// What a retal looks like right now: done, held by me, held by someone else,
// or free. A hold that has run out is free, whatever the last answer said.
export function retalState(retal, nowSeconds) {
  if (retal.done_at) return "done";
  if (!retal.claimed_by || !(retal.claimed_until > nowSeconds)) return "free";
  return retal.claimed_by_me ? "mine" : "taken";
}

// A done retal stays on the list this long (the site drops it then too).
export const DONE_LINGER_SECONDS = 120;

// The retals worth showing: open ones with time left, and done ones for a
// short while.
export function visibleRetals(retals, nowSeconds) {
  return (retals || []).filter((retal) =>
    retal.done_at ? retal.done_at + DONE_LINGER_SECONDS > nowSeconds : retal.expires_at > nowSeconds,
  );
}

// The key a retal is announced under: a new hit after one was done opens a
// fresh retal on the same enemy, which is announced again.
export function noticeKey(retal) {
  return `${retal.enemy_id}:${retal.first_hit_at}`;
}

// Retals worth announcing: open, not held by someone else, with at least
// `minSeconds` left, and not announced in this browser before. `announced`
// is a Set of noticeKey()s.
export function retalsToAnnounce(retals, announced, nowSeconds, minSeconds) {
  return visibleRetals(retals, nowSeconds).filter((retal) => {
    const state = retalState(retal, nowSeconds);
    return (
      (state === "free" || state === "mine") &&
      retal.expires_at - nowSeconds >= minSeconds &&
      !announced.has(noticeKey(retal))
    );
  });
}
