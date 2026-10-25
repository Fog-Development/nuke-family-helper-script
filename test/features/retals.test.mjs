import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// Retal alerts: the script hears Torn's chain feed (both from Torn's own
// getwardata request and from the React props behind the recent attacks
// list), reports what matters to nuke.family once per attack, and lists who
// can still be hit back under Torn's recent attacks.

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

const answer = () => ({ server_now: Math.floor(Date.now() / 1000), retals: [] });

async function open({ list = null, api = {} } = {}) {
  return openTornPage(browser, {
    page: "factions-faction",
    api: { "POST /retals/report": answer, "GET /retals": answer, ...api },
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

  it("does not listen off the main tab", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "factions-controls",
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

// --- The list ----------------------------------------------------------------

const LIST = "#nfh-retals";
const nowSeconds = () => Math.floor(Date.now() / 1000);

function retal(over = {}) {
  return {
    enemy_id: ENEMY, enemy_name: "SiTluX", enemy_faction_id: ENEMY_FACTION, enemy_faction_tag: "JFK",
    victims: [{ id: 3828253, name: "Collibri", result: "Hospitalized", at: nowSeconds() - 60 }],
    first_hit_at: nowSeconds() - 60, last_hit_at: nowSeconds() - 60, expires_at: nowSeconds() + 240,
    claimed_by: null, claimed_until: null, claimed_by_me: false, done_by: null, done_at: null,
    ...over,
  };
}

// Torn's recent attacks list, as the chain box shows it once opened.
const tornList = (page) =>
  page.evaluate(() => {
    const box = document.createElement("div");
    box.innerHTML = `<div class="chain-attacks-title">Recent attacks</div><ul class="chain-attacks-list recent-attacks bottom-round"><li>#6456</li></ul>`;
    document.querySelector("#faction_war_list_id").after(box);
  });

// A site whose list the claim routes change, like the real one.
function siteWith(retals) {
  const site = { retals };
  const list = () => ({ server_now: nowSeconds(), retals: site.retals });
  const claim = (id, me) => {
    site.retals = site.retals.map((r) => (r.enemy_id === id
      ? { ...r, claimed_by: me ? { id: 1, name: "Me" } : null, claimed_until: me ? nowSeconds() + 45 : null, claimed_by_me: me }
      : r));
    return list();
  };
  site.api = {
    "GET /retals": list,
    "POST /retals/report": list,
    [`POST /retals/${ENEMY}/claim`]: () => claim(ENEMY, true),
    [`POST /retals/${ENEMY}/unclaim`]: () => claim(ENEMY, false),
  };
  return site;
}

async function openList(api, options = {}) {
  const session = await openTornPage(browser, { page: "factions-faction", api, before: tornList, ...options });
  await session.page.evaluate(() => {
    window.__opened = [];
    window.open = (url) => {
      const tab = { closed: false, location: { href: url || "" }, close() { this.closed = true; } };
      window.__opened.push(tab);
      return tab;
    };
  });
  return session;
}

const opened = (page) => page.evaluate(() => window.__opened.map((tab) => ({ href: tab.location.href, closed: tab.closed })));
const callsTo = (apiCalls, method, path) => apiCalls.filter((call) => call.method === method && call.path === path);

describe("retal list", () => {
  for (const theme of THEMES) {
    it(`lists open and done retals under recent attacks (${theme})`, async () => {
      const site = siteWith([
        retal({ victims: [{ id: 1, name: "Collibri", at: 1 }, { id: 2, name: "Dos", at: 0 }] }),
        retal({ enemy_id: 555, enemy_name: "Taken<b>", enemy_faction_tag: null, expires_at: nowSeconds() + 45, claimed_by: { id: 9, name: "Other" }, claimed_until: nowSeconds() + 40 }),
        retal({ enemy_id: 666, enemy_name: "Gone", done_at: nowSeconds() - 5, done_by: { id: 3, name: "Collibri" } }),
      ]);
      const { page, errors, close } = await openList(site.api, { theme });
      try {
        await page.waitForSelector(`${LIST} .nfh-rt-row`);
        assert.equal(await page.evaluate(() => document.querySelector("#nfh-retals").previousElementSibling.matches(".recent-attacks")), true);

        const text = await page.locator(LIST).innerText();
        assert.match(text, /Retals\s+2 open/);
        assert.match(text, /SiTluX\s+JFK\s+hit Collibri \+1/);
        assert.match(text, /3:5\d|4:00/);
        assert.match(text, /Taken<b>/); // escaped, not markup
        assert.match(text, /Claimed by Other/);
        assert.match(text, /Gone\s+JFK\s+retal done by Collibri/);

        const first = page.locator(`${LIST} .nfh-rt-row`).first();
        assert.equal(await first.locator(".nfh-rt-name").getAttribute("href"), `/profiles.php?XID=${ENEMY}`);
        assert.equal(await first.locator(".nfh-rt-attack").getAttribute("href"), `/page.php?sid=attack&user2ID=${ENEMY}`);
        assert.equal(await page.locator(`${LIST} .is-taken [data-action="claim"]`).count(), 0);
        assert.equal(await page.locator(`${LIST} .is-done [data-action]`).count(), 0);
        assert.equal(await page.locator(`${LIST} .is-ending`).count(), 1);

        for (const selector of [".nfh-rt-name", ".nfh-rt-left", ".nfh-rt-held", ".nfh-rt-muted"]) {
          const { ratio } = await measureContrast(page, `${LIST} ${selector}`);
          assert.ok(ratio >= 4.5, `${selector} contrast ${ratio.toFixed(2)} in ${theme}`);
        }
        assert.deepEqual(errors, []);
        await screenshot(page.locator(LIST), `retals-list-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("is hidden with nothing open, and drops a retal when its window ends", async () => {
    const site = siteWith([]);
    const { page, close } = await openList(site.api);
    try {
      await page.waitForTimeout(1500);
      assert.equal(await page.locator(LIST).isVisible(), false);

      site.retals = [retal({ expires_at: nowSeconds() + 14 })];
      await page.waitForSelector(`${LIST} .nfh-rt-row`, { timeout: 15000 });
      await page.waitForSelector(`${LIST} .nfh-rt-row`, { state: "detached", timeout: 15000 });
    } finally {
      await close();
    }
  });

  it("claims and unclaims", async () => {
    const site = siteWith([retal()]);
    const { page, apiCalls, close } = await openList(site.api);
    try {
      await page.click(`${LIST} [data-action="claim"]`);
      await page.waitForSelector(`${LIST} [data-action="unclaim"]`);
      assert.match(await page.locator(LIST).innerText(), /Claimed by you/);

      await page.click(`${LIST} [data-action="unclaim"]`);
      await page.waitForSelector(`${LIST} [data-action="claim"]`);
      assert.equal(callsTo(apiCalls, "POST", `/retals/${ENEMY}/claim`).length, 1);
      assert.equal(callsTo(apiCalls, "POST", `/retals/${ENEMY}/unclaim`).length, 1);
    } finally {
      await close();
    }
  });

  it("Attack claims first, then opens the attack page in a new tab", async () => {
    const site = siteWith([retal()]);
    const { page, apiCalls, close } = await openList(site.api);
    try {
      await page.click(`${LIST} [data-action="attack"]`);
      await page.waitForSelector(`${LIST} [data-action="unclaim"]`);
      assert.equal(callsTo(apiCalls, "POST", `/retals/${ENEMY}/claim`).length, 1);
      assert.deepEqual(await opened(page), [{ href: `/page.php?sid=attack&user2ID=${ENEMY}`, closed: false }]);
      assert.ok(page.url().includes("factions.php"));
    } finally {
      await close();
    }
  });

  it("warns instead when someone else holds it, with Attack anyway", async () => {
    const site = siteWith([retal({ claimed_by: { id: 9, name: "Other" }, claimed_until: nowSeconds() + 40 })]);
    const { page, apiCalls, close } = await openList(site.api);
    try {
      await page.click(`${LIST} [data-action="attack"]`);
      await page.waitForSelector(`${LIST} .nfh-rt-warn`);
      assert.match(await page.locator(`${LIST} .nfh-rt-warn`).innerText(), /Other has claimed this retal/);
      assert.equal(callsTo(apiCalls, "POST", `/retals/${ENEMY}/claim`).length, 0);
      assert.deepEqual(await opened(page), []);

      await page.click(`${LIST} [data-action="attack-anyway"]`);
      assert.deepEqual(await opened(page), [{ href: `/page.php?sid=attack&user2ID=${ENEMY}`, closed: false }]);
      assert.equal(await page.locator(`${LIST} .nfh-rt-warn`).count(), 0);
    } finally {
      await close();
    }
  });

  it("closes the tab and warns when the claim loses a race", async () => {
    const site = siteWith([retal()]);
    site.api[`POST /retals/${ENEMY}/claim`] = () => respond(409, {
      server_now: nowSeconds(),
      error: "Other has already claimed this retal.",
      claimed_by: { id: 9, name: "Other" },
      retals: [retal({ claimed_by: { id: 9, name: "Other" }, claimed_until: nowSeconds() + 45 })],
    });
    const { page, close } = await openList(site.api);
    try {
      await page.click(`${LIST} [data-action="attack"]`);
      await page.waitForSelector(`${LIST} .nfh-rt-warn`);
      assert.deepEqual(await opened(page), [{ href: "", closed: true }]);
      assert.match(await page.locator(LIST).innerText(), /Claimed by Other/);

      await page.click(`${LIST} [data-action="dismiss"]`);
      assert.equal(await page.locator(`${LIST} .nfh-rt-warn`).count(), 0);
    } finally {
      await close();
    }
  });

  it("stops asking members outside the family", async () => {
    const { page, apiCalls, close } = await openList({
      "GET /retals": () => respond(403, { error: "Retal alerts are only available to members of a Nuke Family faction." }),
    });
    try {
      await page.waitForTimeout(2500);
      assert.equal(callsTo(apiCalls, "GET", "/retals").length, 1);
      assert.equal(await page.locator(LIST).count(), 0);
    } finally {
      await close();
    }
  });
});
