import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

const BAR = "#nfh-war-bar";
const WAR_URL = "https://www.torn.com/factions.php?step=your#/war/rank";
const BOARD = "/war/board";
const BOARD_WITH_STATS = "/war/board?stats=1";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// The faction fixture was captured with no war open, so the two member lists
// are built here with the class names Torn's own war stylesheet uses (a plain
// class plus a build-hashed one per cell).
const ENEMIES = [
  { id: 501, name: "Foe-Okay", status: "ok", text: "Okay" },
  { id: 502, name: "Foe-LongHosp", status: "hospital not-ok", text: "Hospital" },
  { id: 503, name: "Foe-Abroad", status: "abroad", text: "Abroad" },
  { id: 504, name: "Foe-ShortHosp", status: "hospital not-ok", text: "Hospital" },
  { id: 505, name: "Foe-Revived", status: "ok", text: "Okay" },
];
const FRIENDS = [
  { id: 601, name: "Ally-Hosp", status: "hospital not-ok", text: "Hospital" },
  { id: 602, name: "Ally-Okay", status: "ok", text: "Okay" },
];

function listHtml(side, members) {
  const rows = members
    .map(
      (member) =>
        `<li class="${side} ${side}___x1">` +
        `<div class="member member___tEskU"><a href="/profiles.php?XID=${member.id}">${member.name}</a></div>` +
        '<div class="level level___pwbgk">50</div>' +
        '<div class="points points___LV5Ar">0</div>' +
        `<div class="status status___BLAOt ${member.status}">${member.text}</div>` +
        '<div class="attack attack___naVWZ"><a href="#">Attack</a></div>' +
        "</li>",
    )
    .join("");
  return `<div class="members-cont"><ul class="members-list membersCont___jebcC">${rows}</ul></div>`;
}

async function addWar(page) {
  await page.evaluate(
    ({ enemies, friends }) => {
      const holder = document.createElement("li");
      holder.className = "descriptions";
      holder.innerHTML = `<div class="faction-war"><div class="tab-menu-cont">${enemies}${friends}</div></div>`;
      document.querySelector("#faction_war_list_id").appendChild(holder);
    },
    { enemies: listHtml("enemy", ENEMIES), friends: listHtml("your", FRIENDS) },
  );
}

function board(over = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    data: {
      war: { faction_id: 5678, opponent_id: 4242 },
      server_time: now,
      poll_seconds: 5,
      fetched_at: { 5678: now, 4242: now },
      members: {
        501: { s: "Okay", u: 0, d: "" },
        502: { s: "Hospital", u: now + 3 * 3600, d: "In hospital for 3 hrs" },
        503: { s: "Abroad", u: 0, d: "In Mexico" },
        504: { s: "Hospital", u: now + 125, d: "In hospital for 2 mins" },
        // Torn's page already shows this one okay: revived a moment ago.
        505: { s: "Hospital", u: now + 900, d: "In hospital for 15 mins" },
        601: { s: "Hospital", u: now + 600, d: "In hospital for 10 mins" },
        602: { s: "Okay", u: 0, d: "" },
      },
      ...over,
    },
  };
}

const STATS = { 501: 4_200_000_000, 502: 150_000_000, 504: 9_900_000_000, 505: 780_000_000 };

async function openWar({ api, ...options } = {}) {
  const withStats = board({ stats: STATS });
  return openTornPage(browser, {
    page: "factions-faction",
    url: WAR_URL,
    before: addWar,
    api: { [`GET ${BOARD}`]: board(), [`GET ${BOARD_WITH_STATS}`]: withStats, ...api },
    ...options,
  });
}

const enemyOrder = (page) =>
  page.locator(".faction-war .members-list").first().locator("li a[href*='XID=']").allInnerTexts();
const statusLabel = (page, id) =>
  page.locator(`.faction-war li:has(a[href$="XID=${id}"]) .status`).getAttribute("data-nfh-war");
const boardCalls = (apiCalls) => apiCalls.filter((call) => call.path.startsWith(BOARD));

describe("ranked war board", () => {
  for (const theme of THEMES) {
    it(`labels and sorts both lists by who can be hit next (${theme})`, async () => {
      const { page, errors, apiCalls, close } = await openWar({ theme });
      try {
        await page.waitForSelector(".faction-war [data-nfh-war]");

        assert.deepEqual(await enemyOrder(page), [
          "Foe-Revived", "Foe-Okay", "Foe-ShortHosp", "Foe-LongHosp", "Foe-Abroad",
        ]);
        assert.match(await statusLabel(page, 504), /^2:0\d$/);
        assert.match(await statusLabel(page, 502), /^(3:00:00|2:59:\d\d)$/);
        assert.equal(await statusLabel(page, 503), "MX");
        assert.equal(await statusLabel(page, 501), null);
        assert.equal(await page.locator('.faction-war li[data-nfh-war-row="soon"]').count(), 1);
        assert.equal(await page.locator('.faction-war li[data-nfh-war-row="out"] .member a').innerText(), "Foe-Revived");
        assert.equal(
          await page.locator('.faction-war li:has(a[href$="XID=504"]) .member').getAttribute("data-nfh-war-stats"),
          "9.9b",
        );

        // Our own side is sorted too.
        assert.deepEqual(
          await page.locator(".faction-war .members-list").nth(1).locator("li a[href*='XID=']").allInnerTexts(),
          ["Ally-Okay", "Ally-Hosp"],
        );

        assert.match(await page.locator(BAR).innerText(), /War board[\s\S]*Hospital[\s\S]*Live/);
        assert.deepEqual(boardCalls(apiCalls).map((call) => call.path), [BOARD_WITH_STATS]);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(".faction-war"), `ranked-war-${theme}`);
        await screenshot(page.locator(BAR), `ranked-war-bar-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("re-sorts by stat estimate, and leaves Torn's order alone when asked", async () => {
    const { page, errors, close } = await openWar();
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");

      await page.click(`${BAR} [data-sort="stats-asc"]`);
      assert.deepEqual(await enemyOrder(page), [
        "Foe-LongHosp", "Foe-Revived", "Foe-Okay", "Foe-ShortHosp", "Foe-Abroad",
      ]);

      await page.click(`${BAR} [data-sort="stats-desc"]`);
      assert.deepEqual((await enemyOrder(page)).slice(0, 2), ["Foe-ShortHosp", "Foe-Okay"]);

      // Off: rows stay wherever they are (Torn's own sorting takes over), but
      // the countdowns stay.
      await page.click(`${BAR} [data-sort="off"]`);
      await page.evaluate(() => {
        const list = document.querySelector(".faction-war .members-list");
        list.appendChild(list.firstElementChild);
      });
      await page.waitForTimeout(1300);
      assert.equal((await enemyOrder(page)).at(-1), "Foe-ShortHosp");
      assert.match(await statusLabel(page, 504), /^\d:\d\d$/);

      await page.uncheck(`${BAR} [data-pref="showStats"]`);
      assert.equal(await page.locator(".faction-war [data-nfh-war-stats]").count(), 0);

      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("nfhRankedWar")));
      assert.deepEqual(saved, { sort: "off", showStats: false });
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("follows the page when Torn re-sorts or a status changes", async () => {
    const { page, close } = await openWar();
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");

      // Torn redraws the list in its own order, and Foe-Okay gets hospitalised.
      await page.evaluate(() => {
        const list = document.querySelector(".faction-war .members-list");
        list.appendChild(list.firstElementChild);
        const status = list.querySelector('li:has(a[href$="XID=501"]) .status');
        status.className = "status status___BLAOt hospital not-ok";
        status.textContent = "Hospital";
      });
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll(".faction-war .members-list")][0]
            .querySelector("li a")
            .textContent === "Foe-Revived",
      );

      // The page knows before the API does: in the hospital group, no time yet.
      assert.deepEqual(await enemyOrder(page), [
        "Foe-Revived", "Foe-ShortHosp", "Foe-LongHosp", "Foe-Okay", "Foe-Abroad",
      ]);
      assert.equal(await statusLabel(page, 501), null);
    } finally {
      await close();
    }
  });

  it("offers no stat sorting when the site has no estimates", async () => {
    const { page, close } = await openWar({ api: { [`GET ${BOARD_WITH_STATS}`]: board({ stats: {} }) } });
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");
      assert.equal(await page.locator(`${BAR} [data-sort^="stats"]`).count(), 0);
      assert.equal(await page.locator(`${BAR} [data-pref="showStats"]`).count(), 0);
      assert.equal(await page.locator(`${BAR} [data-sort]`).count(), 2);
    } finally {
      await close();
    }
  });

  it("does nothing to the lists when the site knows of no war, and asks once", async () => {
    const none = { data: { war: null, recheck_seconds: 600 } };
    const { page, errors, apiCalls, close } = await openWar({
      api: { [`GET ${BOARD}`]: none, [`GET ${BOARD_WITH_STATS}`]: none },
    });
    try {
      await page.waitForSelector(`${BAR} .nfh-cw-status`);
      await page.waitForTimeout(2300);

      assert.match(await page.locator(BAR).innerText(), /no ranked war/);
      assert.equal(await page.locator(`${BAR} [data-sort]`).count(), 0);
      assert.equal(await page.locator(".faction-war [data-nfh-war], .faction-war [data-nfh-war-row]").count(), 0);
      assert.equal((await enemyOrder(page))[0], "Foe-Okay");
      assert.equal(boardCalls(apiCalls).length, 1);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("says so when nuke.family cannot be reached", async () => {
    const down = () => respond(500, { message: "Server Error" });
    const { page, apiCalls, close } = await openWar({
      api: { [`GET ${BOARD}`]: down, [`GET ${BOARD_WITH_STATS}`]: down },
    });
    try {
      await page.waitForFunction(() => /Could not reach/.test(document.querySelector("#nfh-war-bar")?.textContent || ""));
      await page.waitForTimeout(1200);
      assert.equal(boardCalls(apiCalls).length, 1);
      assert.equal((await enemyOrder(page))[0], "Foe-Okay");
    } finally {
      await close();
    }
  });

  it("stays out of the way off the ranked war view, and cleans up on leaving it", async () => {
    const elsewhere = await openTornPage(browser, { page: "factions-faction", before: addWar });
    try {
      await elsewhere.page.waitForSelector("#nfh-chain-watch");
      await elsewhere.page.waitForTimeout(1200);
      assert.equal(await elsewhere.page.locator(BAR).count(), 0);
      assert.equal(boardCalls(elsewhere.apiCalls).length, 0);
    } finally {
      await elsewhere.close();
    }

    const { page, close } = await openWar();
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");
      await page.evaluate(() => {
        window.location.hash = "#/";
      });
      await page.waitForSelector(BAR, { state: "detached" });
      assert.equal(await page.locator("[data-nfh-war], [data-nfh-war-row], [data-nfh-war-stats]").count(), 0);
    } finally {
      await close();
    }
  });
});
