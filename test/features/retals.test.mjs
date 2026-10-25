import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage } from "../harness/torn.js";

// Retal alerts, step 2: the script hears Torn's chain feed (both from Torn's
// own getwardata request and from the React props behind the recent attacks
// list) and reports what matters to nuke.family, once per attack.

const OURS = 17133;
const ENEMY = 2031080;
const ENEMY_FACTION = 14365;

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

const nowMs = () => Date.now();

function feed(attacks) {
  return {
    recentAttacks: attacks,
    users: {
      [ENEMY]: { userID: ENEMY, factionID: ENEMY_FACTION, playername: "SiTluX", factiontag: "JFK" },
      3828253: { userID: 3828253, factionID: OURS, playername: "Collibri", factiontag: "NUKE" },
      4336813: { userID: 4336813, factionID: 57471, playername: "1WTT3", factiontag: "" },
    },
  };
}

function incoming(publicID, over = {}) {
  return {
    publicID, attackerID: ENEMY, defenderID: 3828253, firstUserID: 3828253,
    respect: -0.6, finishTimestamp: nowMs() - 20_000, result: "Hospitalized",
    stealthAttack: 0, retal: 0, ...over,
  };
}

// One of ours hitting someone outside any retal: never reported.
function outgoing(publicID) {
  return {
    publicID, attackerID: 3828253, defenderID: 4336813, firstUserID: 3828253,
    respect: 3.5, finishTimestamp: nowMs() - 30_000, result: "Attacked",
    stealthAttack: 0, retal: 0,
  };
}

const answer = { server_now: Math.floor(Date.now() / 1000), retals: [] };

async function open({ report = true, list = null } = {}) {
  return openTornPage(browser, {
    page: "factions-faction",
    api: { "POST /retals/report": answer },
    localStorage: report ? { nfhRetalsReport: "1" } : {},
    // Stand in for Torn's React list: an element whose fiber has warDesc above it.
    before: list
      ? (page) =>
          page.evaluate(({ data, factionId }) => {
            const element = document.createElement("div");
            element.className = "chain-attacks-list recent-attacks";
            document.body.appendChild(element);
            element["__reactFiber$test"] = {
              memoizedProps: { className: "x" },
              return: { memoizedProps: {}, return: { memoizedProps: { warDesc: data, userFactionID: factionId } } },
            };
          }, { data: list, factionId: OURS })
      : undefined,
  });
}

// Make the request Torn's page makes for the chain feed, answered with `body`.
async function tornPolls(page, body, { useFetch = false } = {}) {
  await page.route("**/faction_wars.php*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(body) }),
  );
  await page.evaluate(async (viaFetch) => {
    const url = "/faction_wars.php?redirect=false&step=getwardata&factionID=0&userID=0&wardescid=chain&update=true&rfcv=abc";
    if (viaFetch) {
      await fetch(url, { method: "POST" });
      return;
    }
    await new Promise((resolve) => {
      const request = new XMLHttpRequest();
      request.open("POST", url);
      request.addEventListener("load", resolve);
      request.send("");
    });
  }, useFetch);
}

const reports = (apiCalls) =>
  apiCalls.filter((call) => call.path === "/retals/report").map((call) => JSON.parse(call.data));

async function waitForReports(page, apiCalls, count) {
  for (let i = 0; i < 40 && reports(apiCalls).length < count; i++) await page.waitForTimeout(100);
  return reports(apiCalls);
}

describe("retal capture", () => {
  it("reports an enemy hit from Torn's XHR poll, only what matters, once", async () => {
    const { page, apiCalls, errors, close } = await open();
    try {
      const body = { warDesc: feed([incoming("a1"), outgoing("a2"), incoming("a3", { stealthAttack: 1 })]), userFactionID: OURS };
      await tornPolls(page, body);

      const sent = await waitForReports(page, apiCalls, 1);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].faction_id, OURS);
      assert.deepEqual(sent[0].attacks.map((attack) => attack.id), ["a1"]);
      assert.equal(sent[0].attacks[0].attacker_name, "SiTluX");
      assert.equal(sent[0].attacks[0].attacker_faction_id, ENEMY_FACTION);
      assert.equal(sent[0].attacks[0].stealth, false);

      // Torn polls again with the same attacks: nothing new to send.
      await tornPolls(page, body);
      await page.waitForTimeout(400);
      assert.equal(reports(apiCalls).length, 1);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("hears a fetch poll too, finding the feed wherever it sits", async () => {
    const { page, apiCalls, close } = await open();
    try {
      await tornPolls(page, { data: { chain: { ...feed([incoming("f1")]), userFactionID: OURS } } }, { useFetch: true });
      const sent = await waitForReports(page, apiCalls, 1);
      assert.deepEqual(sent[0].attacks.map((attack) => attack.id), ["f1"]);
    } finally {
      await close();
    }
  });

  it("reads the React props when Torn's first load came before the script", async () => {
    const { page, apiCalls, close } = await open({ list: feed([incoming("r1")]) });
    try {
      const sent = await waitForReports(page, apiCalls, 1);
      assert.equal(sent.length, 1);
      assert.equal(sent[0].faction_id, OURS);
      assert.deepEqual(sent[0].attacks.map((attack) => attack.id), ["r1"]);
    } finally {
      await close();
    }
  });

  it("sends nothing from a release build unless switched on", async () => {
    const { page, apiCalls, close } = await open({ report: false });
    try {
      await tornPolls(page, { warDesc: feed([incoming("n1")]), userFactionID: OURS });
      await page.waitForTimeout(500);
      assert.equal(reports(apiCalls).length, 0);
    } finally {
      await close();
    }
  });

  it("does not listen off the main tab", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "factions-controls",
      localStorage: { nfhRetalsReport: "1" },
    });
    try {
      assert.equal(await page.evaluate(() => !!window.__nfhChainFeedTap), false);
      await page.waitForTimeout(200);
      assert.equal(reports(apiCalls).length, 0);
    } finally {
      await close();
    }
  });
});
