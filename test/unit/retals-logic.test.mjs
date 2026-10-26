import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  attacksToReport,
  feedFactionId,
  formatLeft,
  matters,
  noticeKey,
  normalizeAttack,
  retalState,
  retalsToAnnounce,
  visibleRetals,
} from "../../src/features/retals/logic.js";

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

describe("a retal done, as Torn gives it", () => {
  // Fogest's retal on Stonefight, from Torn's feed on 2026-10-26: the retal
  // field is the icon's level (3), not 1.
  const feed = {
    userFactionID: OURS,
    users: {
      2254826: { userID: 2254826, factionID: OURS, playername: "Fogest", factiontag: "NUKE" },
      3503779: { userID: 3503779, factionID: 1149, playername: "Stonefight", factiontag: "WTF" },
    },
    recentAttacks: [
      {
        publicID: "60a881acfe62180f76471c2e5c73cb02", attackerID: 2254826, defenderID: 3503779,
        firstUserID: 2254826, secondUserID: 3503779, respect: 7.14, finishTimestamp: (NOW - 20) * 1000,
        result: "Hospitalized", stealthAttack: 0, fairFight: 2, warBonus: 0, retal: 3,
        bonusValues: { fairFight: 2.05, warBonus: 1, retal: 1.5 },
      },
    ],
  };

  it("is reported as a retal", () => {
    const [attack] = attacksToReport(feed, OURS, new Set(), NOW);
    assert.equal(attack.retal, true);
    assert.equal(attack.attacker_faction_id, OURS);
    assert.equal(attack.defender_id, 3503779);
  });

  it("a hit without the bonus is not", () => {
    const plain = { ...feed, recentAttacks: [{ ...feed.recentAttacks[0], retal: 0 }] };
    assert.deepEqual(attacksToReport(plain, OURS, new Set(), NOW), []);
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

describe("the list", () => {
  it("formats the countdown", () => {
    assert.equal(formatLeft(245), "4:05");
    assert.equal(formatLeft(59.9), "0:59");
    assert.equal(formatLeft(-3), "0:00");
  });

  it("tells done, mine, taken and free apart, with run-out holds free", () => {
    const held = { claimed_by: { id: 9, name: "X" }, claimed_until: NOW + 10 };
    assert.equal(retalState({ done_at: NOW }, NOW), "done");
    assert.equal(retalState({ ...held, claimed_by_me: true }, NOW), "mine");
    assert.equal(retalState(held, NOW), "taken");
    assert.equal(retalState(held, NOW + 10), "free");
    assert.equal(retalState({ claimed_by: null }, NOW), "free");
  });

  it("shows open retals with time left and done ones for two minutes", () => {
    const list = [
      { enemy_id: 1, expires_at: NOW + 1 },
      { enemy_id: 2, expires_at: NOW },
      { enemy_id: 3, done_at: NOW - 119 },
      { enemy_id: 4, done_at: NOW - 120 },
    ];
    assert.deepEqual(
      visibleRetals(list, NOW).map((retal) => retal.enemy_id),
      [1, 3],
    );
  });
});

describe("retalsToAnnounce", () => {
  const open = (over = {}) => ({ enemy_id: 1, first_hit_at: NOW - 30, expires_at: NOW + 270, claimed_by: null, done_at: null, ...over });

  it("announces open retals not seen before with enough time left", () => {
    const list = [
      open(),
      open({ enemy_id: 2, expires_at: NOW + 29 }),
      open({ enemy_id: 3, done_at: NOW - 5 }),
      open({ enemy_id: 4, claimed_by: { id: 9 }, claimed_until: NOW + 20 }),
      open({ enemy_id: 5, claimed_by: { id: 1 }, claimed_until: NOW + 20, claimed_by_me: true }),
      open({ enemy_id: 6 }),
    ];
    const announced = new Set([noticeKey(open({ enemy_id: 6 }))]);
    assert.deepEqual(
      retalsToAnnounce(list, announced, NOW, 30).map((retal) => retal.enemy_id),
      [1, 5],
    );
  });

  it("announces a fresh retal on an enemy whose last one was done", () => {
    const announced = new Set([noticeKey(open())]);
    assert.equal(retalsToAnnounce([open({ first_hit_at: NOW })], announced, NOW, 30).length, 1);
  });
});
