import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { attacksToReport, feedFactionId, matters, normalizeAttack } from "../../src/features/retals/logic.js";

const OURS = 17133;
const ENEMY_FACTION = 14365;
const NOW = 1_792_963_000;

const users = {
  2031080: { userID: 2031080, factionID: ENEMY_FACTION, playername: "SiTluX", factiontag: "JFK" },
  3828253: { userID: 3828253, factionID: OURS, playername: "Collibri", factiontag: "NUKE" },
  4336813: { userID: 4336813, factionID: 0, playername: "1WTT3", factiontag: "" },
};

// Torn's shape, from the chain feed dump of 2026-10-25.
function tornAttack(overrides = {}) {
  return {
    publicID: "56af",
    attackerID: 2031080,
    defenderID: 3828253,
    firstUserID: 3828253,
    secondUserID: 2031080,
    respect: -0.6,
    finishTimestamp: (NOW - 10) * 1000,
    result: "Hospitalized",
    stealthAttack: 0,
    retal: 0,
    ...overrides,
  };
}

describe("feedFactionId", () => {
  it("uses the faction Torn states", () => {
    assert.equal(feedFactionId({ userFactionID: OURS, recentAttacks: [], users: {} }), OURS);
  });

  it("falls back to our side of the latest attack", () => {
    assert.equal(feedFactionId({ userFactionID: null, recentAttacks: [tornAttack()], users }), OURS);
  });

  it("gives null when nothing says", () => {
    assert.equal(feedFactionId({ recentAttacks: [], users: {} }), null);
  });
});

describe("normalizeAttack", () => {
  it("maps Torn's fields to the site's", () => {
    assert.deepEqual(normalizeAttack(tornAttack(), users), {
      id: "56af",
      attacker_id: 2031080,
      attacker_name: "SiTluX",
      attacker_faction_id: ENEMY_FACTION,
      attacker_faction_tag: "JFK",
      defender_id: 3828253,
      defender_name: "Collibri",
      defender_faction_id: OURS,
      finished_at: NOW - 10,
      respect: -0.6,
      result: "Hospitalized",
      stealth: false,
      retal: false,
    });
  });

  it("treats an attacker with no id as stealthed", () => {
    const attack = normalizeAttack(tornAttack({ attackerID: 0 }), users);
    assert.equal(attack.stealth, true);
    assert.equal(attack.attacker_id, null);
  });

  it("gives a factionless attacker no faction", () => {
    const attack = normalizeAttack(tornAttack({ attackerID: 4336813 }), users);
    assert.equal(attack.attacker_faction_id, null);
    assert.equal(attack.attacker_faction_tag, null);
  });
});

describe("matters", () => {
  const incoming = (overrides) => ({ ...normalizeAttack(tornAttack(), users), ...overrides });

  it("an enemy hit on us that took respect opens a retal", () => {
    assert.equal(matters(incoming({}), OURS), true);
    assert.equal(matters(incoming({ attacker_faction_id: null }), OURS), true);
  });

  it("stealth, no respect lost, or a friendly attacker do not", () => {
    assert.equal(matters(incoming({ stealth: true }), OURS), false);
    assert.equal(matters(incoming({ respect: 0 }), OURS), false);
    assert.equal(matters(incoming({ attacker_faction_id: OURS }), OURS), false);
  });

  it("our hit counts only with Torn's retal flag", () => {
    const outgoing = { attacker_faction_id: OURS, defender_faction_id: ENEMY_FACTION, respect: 3, stealth: false };
    assert.equal(matters({ ...outgoing, retal: true }, OURS), true);
    assert.equal(matters({ ...outgoing, retal: false }, OURS), false);
  });
});

describe("attacksToReport", () => {
  const feed = (attacks) => ({ userFactionID: OURS, users, recentAttacks: attacks });

  it("leaves out sent, old and unimportant attacks", () => {
    const list = attacksToReport(
      feed([
        tornAttack({ publicID: "new" }),
        tornAttack({ publicID: "sent" }),
        tornAttack({ publicID: "old", finishTimestamp: (NOW - 301) * 1000 }),
        tornAttack({ publicID: "stealth", stealthAttack: 1 }),
      ]),
      OURS,
      new Set(["sent"]),
      NOW,
    );
    assert.deepEqual(
      list.map((attack) => attack.id),
      ["new"],
    );
  });
});
