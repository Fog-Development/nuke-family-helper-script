import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

const BAR = "#nfh-war-bar";
const WAR_URL = "https://www.torn.com/factions.php?step=your#/war/rank";
const BOARD = "/war/board";
const BOARD_WITH_STATS = "/war/board?stats=1";
// Another faction's page, as Torn links to it.
const OTHER_WAR_URL = "https://www.torn.com/factions.php?step=profile&ID=9524&referredFrom=1864837#/war/rank";
const OTHER_BOARD = "/war/board?faction_id=9524";
const OTHER_BOARD_WITH_STATS = "/war/board?faction_id=9524&stats=1";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// The faction fixture was captured with no war open, so the two member lists
// are built here, following the markup of a real ranked war (captured from
// Torn in October 2026): the same nesting, and the same plain plus build-hashed
// class on every element Torn's war stylesheet styles.
const ENEMIES = [
  { id: 501, name: "Foe-Okay", status: "okay ok", text: "Okay", score: "1,231.03" },
  { id: 502, name: "Foe-LongHosp", status: "hospital not-ok", text: "Hospital" },
  { id: 503, name: "Foe-Abroad", status: "abroad not-ok", text: "Abroad" },
  { id: 504, name: "Foe-ShortHosp", status: "hospital not-ok", text: "Hospital" },
  { id: 505, name: "Foe-Revived", status: "okay ok", text: "Okay" },
];
// Two more opponents who are okay, for ordering within a status.
const MORE_OKAY = [
  { id: 506, name: "Foe-Scorer", status: "okay ok", text: "Okay", score: "56.64" },
  { id: 507, name: "Foe-Idle", status: "okay ok", text: "Okay" },
];
const FRIENDS = [
  { id: 601, name: "Ally-Hosp", status: "hospital not-ok", text: "Hospital" },
  { id: 602, name: "Ally-Okay", status: "okay ok", text: "Okay" },
];

const SIDE_CLASS = { enemy: "enemy enemy___dUgtm", your: "your your___jlrqu" };

function listHtml(side, members) {
  const rows = members
    .map(
      (member) =>
        `<li class="${SIDE_CLASS[side]}">` +
        '<div class="member icons left member___tEskU">' +
        '<div class="userInfoBox___SpD9F rowSection___wdqaD flexCenter___k97k4 userInfoBoxSmall___GAqwx">' +
        '<div class="factionWrap___jmwRK flexCenter___k97k4 textWrap___Y7pQD customBlockWrap___Oe2Et">' +
        '<a class="linkWrap___oVXBN flexCenter___k97k4" href="/factions.php?step=profile&ID=4242"><span class="factionName___UsSLF">XX</span></a></div>' +
        '<div class="honorWrap___HZmuX flexCenter___k97k4 honorWrapSmall___jqYOv textWrap___Y7pQD customBlockWrap___Oe2Et">' +
        `<a class="linkWrap___oVXBN flexCenter___k97k4" href="/profiles.php?XID=${member.id}"><span class="honorName___s2vRc">${member.name}</span></a>` +
        "</div></div></div>" +
        '<div class="level left level___pwbgk">50</div>' +
        `<div class="points left points___LV5Ar">${member.score || "0.00"}</div>` +
        `<div class="status left prevColumn___UOKmY status___BLAOt ${member.status}">${member.text}</div>` +
        '<div class="attack left attack___naVWZ"><a class="t-blue h c-pointer" href="#">Attack</a></div>' +
        '<div class="clear"></div>' +
        "</li>",
    )
    .join("");
  const header =
    '<div class="white-grad c-pointer">' +
    '<div class="member left member___tEskU tab___uGxm5"><span>Members</span></div>' +
    '<div class="level left level___pwbgk tab___uGxm5">Level</div>' +
    '<div class="points left points___LV5Ar tab___uGxm5">Score</div>' +
    '<div class="status left status___BLAOt tab___uGxm5">Status</div>' +
    '<div class="attack left attack___naVWZ tab___uGxm5">Attack</div><div class="clear"></div></div>';
  const which = side === "enemy" ? "enemy-faction left" : "your-faction right";
  return (
    `<div class="tab-menu-cont cont-gray bottom-round tabMenuCont___kXNgr ${which} profile-mode">` +
    `<div class="members-cont membersCont___jebcC profileMode___u1CTV">${header}` +
    `<ul class="members-list membersCont___jebcC">${rows}</ul></div></div>`
  );
}

async function addWar(page, enemies = ENEMIES) {
  await page.evaluate(
    ({ enemies, friends }) => {
      const holder = document.createElement("li");
      holder.className = "descriptions";
      holder.innerHTML =
        '<div class="desc-wrap warDesc___SKwxb"></div>' +
        `<div class="faction-war membersWrap___DiCDz">${enemies}${friends}<div class="clear"></div></div>`;
      document.querySelector("#faction_war_list_id").appendChild(holder);
    },
    { enemies: listHtml("enemy", enemies), friends: listHtml("your", FRIENDS) },
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
        506: { s: "Okay", u: 0, d: "" },
        507: { s: "Okay", u: 0, d: "" },
      },
      ...over,
    },
  };
}

const BSP = { 501: 4_200_000_000, 502: 150_000_000, 504: 9_900_000_000, 505: 780_000_000 };
// What nuke.family holds from other members' scripts: BSP's for four of the
// opponents (all seen within a day), nothing from FF Scouter.
const held = (bsp = BSP, ffscouter = {}) => ({
  estimates: { bsp, ffscouter },
  estimates_fresh: { bsp: Object.keys(bsp).map(Number), ffscouter: Object.keys(ffscouter).map(Number) },
});

// Put estimates on the rows the way the member's own scripts do: BSP as a
// coloured box inside an attack link beside the name, FF Scouter as a raw
// number on the row.
async function addScripts(page, { bsp = {}, ffscouter = {} }) {
  await page.evaluate(
    ({ bsp, ffscouter }) => {
      for (const row of document.querySelectorAll(".faction-war .members-list li")) {
        const link = row.querySelector("a[href*='XID=']");
        const id = link.href.match(/XID=(\d+)/)[1];
        if (bsp[id]) {
          // As BSP does: before the name, exact figure in data-bsp-stats.
          link.insertAdjacentHTML(
            "beforebegin",
            `<a href="https://www.torn.com/page.php?sid=attack&user2ID=${id}" target="_blank">` +
              '<div style="display: inline-block; margin-left:0px; margin-right:5px;">' +
              `<div class="iconStats" data-bsp-stats="${bsp[id][0]}" style="background:#47A6FF">${bsp[id][1]}</div></div></a>`,
          );
        }
        if (ffscouter[id]) row.dataset.estValue = String(ffscouter[id]);
      }
    },
    { bsp, ffscouter },
  );
}

async function openWar({ api, ...options } = {}) {
  const withStats = board(held());
  return openTornPage(browser, {
    page: "factions-faction",
    url: WAR_URL,
    before: addWar,
    ...options,
    api: { [`GET ${BOARD}`]: board(), [`GET ${BOARD_WITH_STATS}`]: withStats, ...api },
  });
}

const enemyOrder = (page) =>
  page.locator(".faction-war ul.members-list").first().locator("li a[href*='XID=']").allInnerTexts();
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
        assert.equal(await page.locator('.faction-war li[data-nfh-war-row="out"] a[href*="XID="]').innerText(), "Foe-Revived");
        assert.equal(
          await page.locator('.faction-war li:has(a[href$="XID=504"]) .member').getAttribute("data-nfh-war-stats"),
          "9.9b",
        );

        // Our own side is sorted too.
        assert.deepEqual(
          await page.locator(".faction-war ul.members-list").nth(1).locator("li a[href*='XID=']").allInnerTexts(),
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
      assert.deepEqual(saved, { sort: "off", then: "score-desc", showStats: false, source: "bsp" });
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("orders members with the same status by score when asked", async () => {
    const { page, errors, close } = await openWar({ before: (page) => addWar(page, [...ENEMIES, ...MORE_OKAY]) });
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");
      const okay = async () => (await enemyOrder(page)).filter((name) => /Okay|Scorer|Idle/.test(name));

      // Default: highest score first.
      assert.deepEqual(await okay(), ["Foe-Okay", "Foe-Scorer", "Foe-Idle"]);

      await page.selectOption(`${BAR} [data-pref="then"]`, "score-desc");
      assert.deepEqual(await okay(), ["Foe-Okay", "Foe-Scorer", "Foe-Idle"]);
      await page.selectOption(`${BAR} [data-pref="then"]`, "score-asc");
      assert.deepEqual(await okay(), ["Foe-Idle", "Foe-Scorer", "Foe-Okay"]);
      // Status still comes first.
      assert.deepEqual((await enemyOrder(page)).slice(-3), ["Foe-ShortHosp", "Foe-LongHosp", "Foe-Abroad"]);

      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("nfhRankedWar")));
      assert.equal(saved.then, "score-asc");

      // Only offered with the status sort.
      await page.click(`${BAR} [data-sort="stats-asc"]`);
      assert.equal(await page.locator(`${BAR} [data-pref="then"]`).count(), 0);
      assert.deepEqual(errors, []);
      await page.click(`${BAR} [data-sort="status"]`);
      await screenshot(page.locator(BAR), "ranked-war-bar-then");
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
            .querySelector("li a[href*=XID]")
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

  it("offers no stat sorting when nobody has an estimate", async () => {
    const { page, close } = await openWar({ api: { [`GET ${BOARD_WITH_STATS}`]: board(held({})) } });
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");
      assert.equal(await page.locator(`${BAR} [data-sort^="stats"]`).count(), 0);
      assert.equal(await page.locator(`${BAR} [data-pref="showStats"]`).count(), 0);
      assert.equal(await page.locator(`${BAR} [data-sort]`).count(), 2);
    } finally {
      await close();
    }
  });

  it("uses the member's own BSP and FF Scouter estimates and passes on what the site lacks", async () => {
    const posts = [];
    const { page, errors, apiCalls, close } = await openWar({
      before: async (page) => {
        await addWar(page);
        // Their BSP shows three opponents: one the site has differently (504)
        // and one it has nothing for (503). Their FF Scouter shows two.
        await addScripts(page, {
          bsp: { 501: [4_234_567_890, "4.2b"], 504: [1_155_848_491, "1.1b"], 503: [0, "371m"] },
          ffscouter: { 501: 5_000_000_000, 502: 90_000_000 },
        });
      },
      api: {
        "POST /war/estimates": (details) => {
          posts.push(JSON.parse(details.data));
          return { stored: 1 };
        },
      },
    });
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");
      await page.click(`${BAR} [data-sort="stats-asc"]`);

      // BSP is preferred: their own box where there is one (504 is 1.1b, not
      // the site's 9.9b), then their FF Scouter (502 is 90m), then the site's.
      assert.deepEqual(await enemyOrder(page), [
        "Foe-LongHosp", "Foe-Abroad", "Foe-Revived", "Foe-ShortHosp", "Foe-Okay",
      ]);

      // Our own badge only where their scripts show nothing.
      const badge = (id) =>
        page.locator(`.faction-war li:has(a[href$="XID=${id}"]) .member`).getAttribute("data-nfh-war-stats");
      assert.equal(await badge(504), null);
      assert.equal(await badge(503), null);
      assert.equal(await badge(502), null);
      assert.equal(await badge(505), "780m");

      // Preferring FF Scouter puts 501 at their FF Scouter's 5b: last.
      await page.selectOption(`${BAR} [data-pref="source"]`, "ffscouter");
      assert.equal((await enemyOrder(page)).at(-1), "Foe-Okay");
      await page.selectOption(`${BAR} [data-pref="source"]`, "bsp");
      assert.equal((await enemyOrder(page)).at(-1), "Foe-Okay");

      // Only what the site does not already hold is sent, once.
      await page.waitForTimeout(4600);
      const sent = Object.fromEntries(posts.map((post) => [post.source, post.estimates]));
      // 503's box had no exact figure, so its text was read.
      assert.deepEqual(sent.bsp, [{ id: 503, total: 371_000_000 }]);
      assert.deepEqual(sent.ffscouter, [
        { id: 501, total: 5_000_000_000 },
        { id: 502, total: 90_000_000 },
      ]);
      await page.waitForTimeout(1500);
      assert.equal(apiCalls.filter((call) => call.path === "/war/estimates").length, 2);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "ranked-war-bar-both-sources");
      await screenshot(page.locator(".faction-war"), "ranked-war-with-scripts");
    } finally {
      await close();
    }
  });

  it("leaves a list alone while FF Scouter is filtering it", async () => {
    const { page, close } = await openWar({
      before: async (page) => {
        await addWar(page);
        await page.evaluate(() => {
          document.querySelector(".faction-war .members-list").setAttribute("data-ffscouter-active-filter", "true");
        });
      },
    });
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");
      assert.equal((await enemyOrder(page))[0], "Foe-Okay");
      assert.match(await statusLabel(page, 504), /^\d:\d\d$/);
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

  it("works on another faction's war page, asking the site about that faction", async () => {
    const posts = [];
    const { page, errors, apiCalls, close } = await openWar({
      url: OTHER_WAR_URL,
      before: async (page) => {
        await addWar(page);
        await addScripts(page, { ffscouter: { 503: 371_000_000 } });
      },
      api: {
        [`GET ${OTHER_BOARD}`]: board(),
        [`GET ${OTHER_BOARD_WITH_STATS}`]: board(held()),
        "POST /war/estimates": (details) => {
          posts.push(JSON.parse(details.data));
          return { stored: 1 };
        },
      },
    });
    try {
      await page.waitForSelector(".faction-war [data-nfh-war]");

      assert.deepEqual(await enemyOrder(page), [
        "Foe-Revived", "Foe-Okay", "Foe-ShortHosp", "Foe-LongHosp", "Foe-Abroad",
      ]);
      assert.match(await statusLabel(page, 504), /^2:0\d$/);
      assert.match(await page.locator(BAR).innerText(), /War board[\s\S]*Live/);

      await page.waitForTimeout(5200);
      assert.deepEqual(posts, [
        { source: "ffscouter", faction_id: 9524, estimates: [{ id: 503, total: 371_000_000 }] },
      ]);
      // Never the member's own faction's board.
      const asked = boardCalls(apiCalls).map((call) => call.path);
      assert.equal(asked[0], OTHER_BOARD_WITH_STATS);
      assert.ok(asked.every((path) => path === OTHER_BOARD_WITH_STATS || path === OTHER_BOARD), asked.join(" "));
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("says so when the other faction has no ranked war on", async () => {
    const none = { data: { war: null, recheck_seconds: 600 } };
    const { page, apiCalls, close } = await openWar({
      url: OTHER_WAR_URL,
      api: { [`GET ${OTHER_BOARD_WITH_STATS}`]: none },
    });
    try {
      await page.waitForFunction(() => /no ranked war on for this faction/.test(document.querySelector("#nfh-war-bar")?.textContent || ""));
      await page.waitForTimeout(1300);
      assert.equal(boardCalls(apiCalls).length, 1);
      assert.equal(await page.locator(".faction-war [data-nfh-war]").count(), 0);
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
