import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, loadPageFixture, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// Pick real row identities out of the fixture: a player to shitlist and a
// different row's faction to mark friendly.
function pickRows() {
  const html = loadPageFixture("hospitalview");
  // One chunk per hospital row (each ends with the bottom-white spacer).
  const rows = html
    .split('<div class="bottom-white"></div>')
    .map((chunk) => ({
      playerId: chunk.match(/class="user name" href="\/profiles\.php\?XID=(\d+)"/)?.[1],
      factionId: chunk.match(/class="user faction" href="\/factions\.php\?step=profile&amp;ID=(\d+)"/)?.[1],
    }))
    .filter((r) => r.playerId && r.factionId);
  const shit = rows[0];
  const friendly = rows.find((r) => r.factionId !== shit.factionId && r.playerId !== shit.playerId);
  assert.ok(shit && friendly, "fixture needs two hospital rows with different factions");
  return { shit, friendly };
}

function entry(id, over) {
  return {
    id, playerName: "x", playerId: null, factionId: null, factionName: "f",
    isFactionBan: false, isApproved: true, shitListCategoryId: 1, reason: "r",
    updated_at: "2026-10-01T00:00:00Z",
    shitListCategory: { name: "Scammer", is_friendly: false },
    ...over,
  };
}

// What the shitlist store keeps in localStorage for a given API payload
// (same shape as src/features/shitlist/data.js builds).
function cachedShitlist(apiEntries) {
  const shitListEntries = {};
  for (const e of apiEntries) {
    const key = (e.isFactionBan ? "f" + e.factionId : "p" + e.playerId) + "#" + e.id;
    shitListEntries[key] = {
      entryId: e.id, playerId: e.playerId, factionId: e.factionId,
      isFactionBan: e.isFactionBan, isApproved: e.isApproved,
      shitListCategoryId: e.shitListCategoryId, reason: e.reason,
      updatedAt: e.updated_at, shitListCategory: e.shitListCategory,
    };
  }
  return { shitListEntries, timestamp: Date.now() };
}

function hospitalScenario() {
  const { shit, friendly } = pickRows();
  const data = [
    entry(1, { playerId: Number(shit.playerId) }),
    entry(2, {
      factionId: Number(friendly.factionId), isFactionBan: true,
      shitListCategoryId: 2,
      shitListCategory: { name: "Ally", is_friendly: true },
    }),
  ];
  return { api: { "GET /shit-lists": { data } }, data };
}

describe("hospital row highlighting", () => {
  for (const theme of THEMES) {
    it(`colours shitlisted and friendly rows with a warm cache (${theme})`, async () => {
      const { api, data } = hospitalScenario();
      const { page, errors, close } = await openTornPage(browser, {
        page: "hospitalview",
        theme,
        api,
        localStorage: { shitListEntriesList: cachedShitlist(data) },
      });
      try {
        await page.waitForSelector(".nfh-hospital-shitlist");
        assert.ok((await page.locator(".nfh-hospital-shitlist").count()) >= 1);
        assert.ok((await page.locator(".nfh-hospital-friendly").count()) >= 1);
        assert.deepEqual(errors, []);
        await screenshot(page, `hospital-${theme}`);
      } finally {
        await close();
      }
    });
  }

  // A contract covering the shitlisted row's player, with the member's faction
  // already known.
  function openWithContract(reviving, localStorage = {}) {
    const { shit } = pickRows();
    const coverage = [{
      player_ids: [Number(shit.playerId)],
      contract: { contract_start_date: "2026-01-01 00:00:00", contract_end_date: null },
    }];
    return openTornPage(browser, {
      page: "hospitalview",
      api: {
        "GET /contracts/active-coverage": { coverage },
        "GET /user/get-own-roles": { role: "member", in_reviving_faction: reviving },
      },
      localStorage: {
        nfhUserRole: { role: "member", reviving, timestamp: Date.now() },
        ...localStorage,
      },
    });
  }

  it("colours contract clients for a member of a reviving faction", async () => {
    const { page, apiCalls, close } = await openWithContract(true);
    try {
      await page.waitForSelector(".nfh-hospital-contract", { timeout: 5000 });
      assert.ok(apiCalls.some((c) => c.path === "/contracts/active-coverage"));
    } finally {
      await close();
    }
  });

  it("neither colours nor fetches contracts with the setting off", async () => {
    const { page, apiCalls, close } = await openWithContract(false);
    try {
      await page.waitForSelector(".nfh-hospital-processed");
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".nfh-hospital-contract").count(), 0);
      assert.ok(!apiCalls.some((c) => c.path === "/contracts/active-coverage"));
    } finally {
      await close();
    }
  });

  it("colours contract clients for a non-reviver who turned the setting on", async () => {
    const { page, close } = await openWithContract(false, { nfhShowActiveContract: "true" });
    try {
      await page.waitForSelector(".nfh-hospital-contract", { timeout: 5000 });
    } finally {
      await close();
    }
  });

  // Regression: with a cold cache the rows used to be processed once, before
  // the shitlist API response arrived, and never re-processed.
  it("colours rows once the data arrives on a cold cache", async () => {
    const { api } = hospitalScenario();
    const { page, close } = await openTornPage(browser, { page: "hospitalview", api });
    try {
      await page.waitForSelector(".nfh-hospital-shitlist", { timeout: 5000 });
    } finally {
      await close();
    }
  });
});
