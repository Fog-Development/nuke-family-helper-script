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

  it("is one quiet line with nothing open, and drops a retal when its window ends", async () => {
    const site = siteWith([]);
    const { page, close } = await openList(site.api);
    try {
      await page.waitForTimeout(1500);
      assert.match(await page.locator(LIST).innerText(), /Retals\s+none open\s+Settings/);
      assert.equal(await page.locator(`${LIST} [data-region="list"]`).isVisible(), false);
      assert.ok((await page.locator(LIST).boundingBox()).height <= 34);

      site.retals = [retal({ expires_at: nowSeconds() + 14 })];
      await page.waitForSelector(`${LIST} .nfh-rt-row`, { timeout: 15000 });
      await page.waitForSelector(`${LIST} .nfh-rt-row`, { state: "detached", timeout: 15000 });
    } finally {
      await close();
    }
  });

  it("asks every 5s with recent attacks open, every 10s with the chain box closed", async () => {
    const site = siteWith([retal()]);
    const closed = await openTornPage(browser, { page: "factions-faction", api: site.api });
    try {
      await closed.page.waitForTimeout(11_500);
      const gets = callsTo(closed.apiCalls, "GET", "/retals").length;
      assert.ok(gets >= 1 && gets <= 2, `closed: ${gets} calls`);
      // Opening the box shows the list at once, from what was already fetched.
      await tornList(closed.page);
      await closed.page.waitForSelector(`${LIST} .nfh-rt-row`, { timeout: 1500 });
    } finally {
      await closed.close();
    }

    const open = await openList(site.api);
    try {
      await open.page.waitForTimeout(11_500);
      const gets = callsTo(open.apiCalls, "GET", "/retals").length;
      assert.ok(gets >= 2 && gets <= 3, `open: ${gets} calls`);
    } finally {
      await open.close();
    }
  });

  it("fits a phone screen", async () => {
    const site = siteWith([retal({ claimed_by: { id: 9, name: "Someone Long" }, claimed_until: nowSeconds() + 40 }), retal({ enemy_id: 555 })]);
    const { page, close } = await openList(site.api, { viewport: { width: 375, height: 812 } });
    try {
      await page.waitForSelector(`${LIST} .nfh-rt-row`);
      const overflow = await page.evaluate(() => {
        const list = document.querySelector("#nfh-retals");
        return [...list.querySelectorAll("*")].some((node) => node.getBoundingClientRect().right > list.getBoundingClientRect().right + 1);
      });
      assert.equal(overflow, false);
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

// --- Notices, settings and stat tags -------------------------------------------

const TOAST = "#nfh-retal-toast";

const stubOpen = (page) =>
  page.evaluate(() => {
    window.__opened = [];
    window.open = (url) => {
      const tab = { closed: false, location: { href: url || "" }, close() { this.closed = true; } };
      window.__opened.push(tab);
      return tab;
    };
  });

describe("retal notices", () => {
  for (const theme of THEMES) {
    it(`announce a new retal once, with Attack (${theme})`, async () => {
      const site = siteWith([retal()]);
      const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "factions-faction", api: site.api, theme });
      try {
        // Announced even with the chain box closed.
        await page.waitForSelector(TOAST, { timeout: 3000 });
        assert.match(await page.locator(TOAST).innerText(), /Retal: SiTluX\s+JFK\s*hit Collibri · [34]:\d\d left/);
        const { ratio } = await measureContrast(page, `${TOAST} .nfh-rt-toast-text`);
        assert.ok(ratio >= 4.5, `toast contrast ${ratio.toFixed(2)} in ${theme}`);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(TOAST), `retals-toast-${theme}`);

        await stubOpen(page);
        await page.click(`${TOAST} [data-toast="attack"]`);
        assert.equal(await page.locator(TOAST).count(), 0);
        for (let i = 0; i < 20 && !callsTo(apiCalls, "POST", `/retals/${ENEMY}/claim`).length; i++) await page.waitForTimeout(100);
        assert.equal(callsTo(apiCalls, "POST", `/retals/${ENEMY}/claim`).length, 1);
        for (let i = 0; i < 20 && !(await opened(page)).length; i++) await page.waitForTimeout(100);
        assert.deepEqual(await opened(page), [{ href: `/page.php?sid=attack&user2ID=${ENEMY}`, closed: false }]);

        // The next answers carry the same retal: no second notice.
        await page.waitForTimeout(11_000);
        assert.equal(await page.locator(TOAST).count(), 0);
      } finally {
        await close();
      }
    });
  }

  it("are not repeated on the next page load, and skip retals with too little time left", async () => {
    const old = retal({ first_hit_at: nowSeconds() - 60 });
    const site = siteWith([old, retal({ enemy_id: 777, enemy_name: "Late", expires_at: nowSeconds() + 20 })]);
    const announced = { [`${ENEMY}:${old.first_hit_at}`]: nowSeconds() - 30 };
    const { page, close } = await openTornPage(browser, { page: "factions-faction", api: site.api, localStorage: { nfhRetalsAnnounced: announced } });
    try {
      await page.waitForTimeout(2500);
      assert.equal(await page.locator(TOAST).count(), 0);
    } finally {
      await close();
    }
  });

  it("puts several new retals in one notice", async () => {
    const site = siteWith([retal(), retal({ enemy_id: 555, enemy_name: "Second" })]);
    const { page, close } = await openTornPage(browser, { page: "factions-faction", api: site.api });
    try {
      await page.waitForSelector(TOAST, { timeout: 3000 });
      assert.match(await page.locator(TOAST).innerText(), /2 new retals: SiTluX, Second/);
      assert.equal(await page.locator(`${TOAST} [data-toast="attack"]`).count(), 0);
    } finally {
      await close();
    }
  });

  it("stay quiet with notices off, and can add a desktop notification", async () => {
    const site = siteWith([]);
    const { page, close } = await openList(site.api, { localStorage: { nfhRetals: { notify: false } } });
    try {
      await page.evaluate(() => {
        window.__notices = [];
        window.Notification = function (title, options) {
          window.__notices.push({ title, body: options.body });
        };
        window.Notification.permission = "default";
        window.Notification.requestPermission = async () => {
          window.Notification.permission = "granted";
          return "granted";
        };
      });
      site.retals = [retal()];
      await page.waitForTimeout(6500);
      assert.equal(await page.locator(TOAST).count(), 0);

      await page.click(`${LIST} [data-action="settings"]`);
      await page.check(`${LIST} [data-pref="notify"]`);
      await page.check(`${LIST} [data-pref="desktop"]`);
      await page.waitForFunction(() => JSON.parse(localStorage.getItem("nfhRetals")).desktop === true);

      site.retals = [retal({ enemy_id: 555, enemy_name: "Second" })];
      await page.waitForSelector(TOAST, { timeout: 7000 });
      const notices = await page.evaluate(() => window.__notices);
      assert.equal(notices.length, 1);
      assert.equal(notices[0].title, "Retal: Second");
      assert.match(notices[0].body, /^hit Collibri · \d:\d\d left$/);
    } finally {
      await close();
    }
  });
});

describe("retal settings", () => {
  for (const theme of THEMES) {
    it(`open from the header line and persist (${theme})`, async () => {
      const site = siteWith([retal()]);
      const { page, errors, close } = await openList(site.api, { theme });
      try {
        await page.click(`${LIST} [data-action="settings"]`);
        await page.waitForSelector(`${LIST} .nfh-rt-settings`);
        assert.equal(await page.locator(`${LIST} [data-pref="sound"]`).isChecked(), false);
        assert.equal(await page.locator(`${LIST} [data-pref="volume"]`).isDisabled(), true);
        await page.check(`${LIST} [data-pref="sound"]`);
        assert.equal(await page.locator(`${LIST} [data-pref="volume"]`).isDisabled(), false);
        await page.selectOption(`${LIST} [data-pref="minSeconds"]`, "60");

        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("nfhRetals")));
        assert.equal(saved.sound, true);
        assert.equal(saved.minSeconds, 60);

        // The countdown ticking does not redraw the settings under the cursor.
        const panel = await page.locator(`${LIST} .nfh-rt-settings`).elementHandle();
        await page.waitForTimeout(1500);
        assert.equal(await panel.evaluate((node) => node.isConnected), true);

        const { ratio } = await measureContrast(page, `${LIST} .nfh-rt-settings label span`);
        assert.ok(ratio >= 4.5, `settings contrast ${ratio.toFixed(2)} in ${theme}`);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(LIST), `retals-settings-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("with Show retals off: no list, no polling, no reports, header says off", async () => {
    const site = siteWith([retal()]);
    const { page, apiCalls, close } = await openList(site.api, { localStorage: { nfhRetals: { show: false } } });
    try {
      await tornPolls(page, { warDesc: feed([incoming("off1")]), userFactionID: OURS });
      await page.waitForTimeout(2500);
      assert.match(await page.locator(LIST).innerText(), /Retals\s+off/);
      assert.equal(await page.locator(`${LIST} .nfh-rt-row`).count(), 0);
      assert.equal(callsTo(apiCalls, "GET", "/retals").length, 0);
      assert.equal(reports(apiCalls).length, 0);
      assert.equal(await page.locator(TOAST).count(), 0);

      await page.click(`${LIST} [data-action="settings"]`);
      await page.check(`${LIST} [data-pref="show"]`);
      await page.waitForSelector(`${LIST} .nfh-rt-row`, { timeout: 3000 });
    } finally {
      await close();
    }
  });
});

describe("retal stat tags", () => {
  // Torn's row for the enemy, as BSP and FF Scouter leave it.
  const decoratedList = (page) =>
    page.evaluate((enemy) => {
      const box = document.createElement("div");
      box.innerHTML = `<div class="chain-attacks-title">Recent attacks</div><ul class="chain-attacks-list recent-attacks bottom-round"><li>
        <div class="userInfoBox___SpD9F ffscouter-gauge" style="--band-percent: 40" data-ffscouter-band-side="left" data-ffscouter-attach-mode="fallback">
          <div class="honorWrap___x"><a href="/profiles.php?XID=${enemy}">SiTluX</a><div class="iconStats" data-bsp-stats="3400000000" style="background:#e5414a">3.4b</div></div>
          <div class="ffscouter-marker-wrapper"><svg class="ffscouter-arrow" width="6" height="6"></svg></div>
        </div></li></ul>`;
      document.querySelector("#faction_war_list_id").after(box);
    }, ENEMY);

  it("copies BSP's tag and FF Scouter's gauge from Torn's row", async () => {
    const site = siteWith([retal()]);
    const { page, close } = await openList(site.api, { before: decoratedList });
    try {
      await page.waitForSelector(`${LIST} .nfh-rt-who .iconStats`, { timeout: 4000 });
      const who = page.locator(`${LIST} .nfh-rt-who`).first();
      assert.equal(await who.locator(".iconStats").innerText(), "3.4b");
      assert.equal(await who.locator(".iconStats").getAttribute("data-bsp-stats"), "3400000000");
      assert.equal(await who.evaluate((node) => node.classList.contains("ffscouter-gauge")), true);
      assert.equal(await who.evaluate((node) => node.style.getPropertyValue("--band-percent").trim()), "40");
      assert.equal(await who.getAttribute("data-ffscouter-band-side"), "left");
      assert.equal(await who.locator(".ffscouter-marker-wrapper svg").count(), 1);

      // Still there after Torn's row is gone.
      await page.evaluate(() => document.querySelector(".recent-attacks li").remove());
      await page.waitForTimeout(1500);
      assert.equal(await page.locator(`${LIST} .nfh-rt-who .iconStats`).count(), 1);
    } finally {
      await close();
    }
  });

  it("falls back to BSP's cached prediction, and reads nothing else of theirs", async () => {
    const site = siteWith([retal()]);
    const { page, close } = await openList(site.api, {
      localStorage: {
        [`tdup.battleStatsPredictor.cache.prediction.${ENEMY}`]: { TBS: 1_250_000_000, Score: 1 },
        "ffsv3-api-key": "secret-key",
      },
    });
    try {
      await page.evaluate(() => {
        const getItem = Storage.prototype.getItem;
        window.__read = [];
        Storage.prototype.getItem = function (key) {
          window.__read.push(key);
          return getItem.call(this, key);
        };
      });
      await page.waitForSelector(`${LIST} .nfh-rt-bsp`, { timeout: 4000 });
      assert.equal(await page.locator(`${LIST} .nfh-rt-bsp`).innerText(), "1.3b");
      await page.waitForTimeout(1200);
      const read = await page.evaluate(() => window.__read);
      assert.equal(read.some((key) => key.startsWith("ffsv3")), false);
      assert.ok(read.filter((key) => key.startsWith("tdup.")).every((key) => key === `tdup.battleStatsPredictor.cache.prediction.${ENEMY}`));
    } finally {
      await close();
    }
  });
});
