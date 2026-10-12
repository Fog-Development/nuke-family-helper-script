import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, screenshot } from "../harness/torn.js";
import { measureContrast, setTheme, THEMES } from "../harness/theme.js";

const SECTION = ".nfh-shitlist-profile";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// The captured profile belongs to a player with no faction. Real Torn shows
// a faction member's faction as a link in the Faction row of Basic
// Information, so this swaps that row's value for one.
async function putPlayerInFaction(page) {
  await page.evaluate(() => {
    const row = [...document.querySelectorAll(".basic-information .info-table li")].find(
      (li) => li.querySelector(".user-information-section")?.textContent.trim() === "Faction",
    );
    row.querySelector(".user-info-value").innerHTML =
      '<span><a class="t-blue" href="/factions.php?step=profile&ID=5678">Test Faction</a></span>';
  });
}

async function openProfile(options = {}) {
  const session = await openTornPage(browser, { page: "profiles", ...options });
  await session.page.waitForSelector(`${SECTION} #nfh-shitlist-profile-list li`);
  return session;
}

describe("shitlist profile section", () => {
  for (const theme of THEMES) {
    describe(`${theme} theme`, () => {
      it("renders the player's entries", async () => {
        const { page, errors, close } = await openProfile({ theme });
        try {
          assert.equal(await page.locator(`${SECTION} li`).count(), 2);
          assert.match(await page.locator(SECTION).innerText(), /Pending Approval/);
          assert.deepEqual(errors, []);
          await screenshot(page.locator(SECTION), `shitlist-profile-${theme}`);
          await screenshot(page, `shitlist-profile-page-${theme}`);
        } finally {
          await close();
        }
      });

      it("adds the faction's entries when the player is in a faction", async () => {
        const { page, close } = await openProfile({ theme, before: putPlayerInFaction });
        try {
          await page.waitForFunction(
            (sel) => document.querySelectorAll(`${sel} li`).length === 3,
            SECTION,
          );
          assert.match(await page.locator(SECTION).innerText(), /Whole faction banned/);
          await screenshot(page.locator(SECTION), `shitlist-profile-faction-${theme}`);
        } finally {
          await close();
        }
      });

      it("has readable text contrast", async () => {
        const { page, close } = await openProfile({ theme });
        try {
          for (const selector of [
            `${SECTION} .nfh-section-title`,
            `${SECTION} .nfh-list-key`,
            `${SECTION} .nfh-list-value`,
          ]) {
            const { ratio, fg, bgDark, bgLight } = await measureContrast(page, selector);
            assert.ok(
              ratio >= 4.5,
              `${selector} contrast ${ratio.toFixed(2)} < 4.5 (text rgb(${fg}) on rgb(${bgDark})..rgb(${bgLight}))`,
            );
          }
        } finally {
          await close();
        }
      });
    });
  }

  it("follows a live theme switch without re-injecting", async () => {
    const { page, close } = await openProfile({ theme: "light" });
    try {
      const bgOf = () =>
        page.locator(`${SECTION} .nfh-section-container`).evaluate(
          (el) => getComputedStyle(el).backgroundColor,
        );
      const light = await bgOf();
      await setTheme(page, "dark");
      assert.notEqual(await bgOf(), light);
      assert.equal(await page.locator(SECTION).count(), 1);
    } finally {
      await close();
    }
  });

  it("re-injects after Torn wipes the section and navigates", async () => {
    const { page, close } = await openProfile();
    try {
      await page.evaluate(() => {
        document.querySelector(".nfh-shitlist-profile").remove();
        history.pushState({}, "", "/profiles.php?XID=1234&x=1");
      });
      await page.waitForSelector(SECTION);
      assert.equal(await page.locator(SECTION).count(), 1);
    } finally {
      await close();
    }
  });

  it("escapes API-sourced text instead of rendering HTML", async () => {
    const entry = {
      id: 999, playerName: "x", playerId: 1234, factionId: 5678, factionName: "f",
      isFactionBan: false, isApproved: true, shitListCategoryId: 1,
      reason: "<img src=x onerror=\"window.__pwned=1\"><b>bold</b>",
      updated_at: "2026-10-01T00:00:00Z",
      shitListCategory: { name: "Scammer", is_friendly: false },
    };
    const { page, close } = await openProfile({
      api: { "GET /shit-lists": { data: [entry] } },
    });
    try {
      assert.equal(await page.locator(`${SECTION} li img, ${SECTION} li b`).count(), 0);
      assert.equal(await page.evaluate(() => window.__pwned), undefined);
      assert.match(await page.locator(SECTION).innerText(), /<img src=x/);
    } finally {
      await close();
    }
  });
});
