import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, loadApiFixture, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

const BAR = "#nfh-oc-bar";
const ROOT = "#faction-crimes-root";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// The capture was taken by a member already in a crime, so Torn has every
// Join button disabled. Most tests want a member who is free to join.
const enableJoining = (page) =>
  page.evaluate(() => {
    for (const button of document.querySelectorAll('button[class*="joinButton___"]')) {
      button.disabled = false;
    }
  });

async function openRecruiting(options = {}) {
  const session = await openTornPage(browser, {
    page: "factions-crimes-recruiting",
    before: enableJoining,
    ...options,
  });
  await session.page.waitForSelector(BAR);
  return session;
}

// "Role name: chip text (state)" for every slot of a crime.
const chipsOf = (page, crimeId) =>
  page.evaluate((id) => {
    const crime = document.querySelector(`[data-oc-id="${id}"]`);
    return [...crime.querySelectorAll('button[class^="slotHeader___"]')].map((header) => {
      const chip = header.parentElement.querySelector(":scope > .nfh-oc-min");
      const state = chip ? [...chip.classList].find((name) => name.startsWith("nfh-oc-min--")) : null;
      return [
        header.querySelector('[class^="title___"]').textContent.trim(),
        chip ? chip.textContent : null,
        state ? state.replace("nfh-oc-min--", "") : null,
      ];
    });
  }, crimeId);

// Where each suggestion tag sits: [crime id, role, tag text].
const picksOf = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".nfh-oc-pick")].map((slot) => [
      slot.closest("[data-oc-id]").getAttribute("data-oc-id"),
      slot.querySelector('[class^="title___"]').textContent.trim(),
      slot.querySelector(":scope > .nfh-oc-tag").textContent,
    ]),
  );

describe("OC Assistant on the Recruiting tab", () => {
  for (const theme of THEMES) {
    it(`marks the best slot and the faction's minimums (${theme})`, async () => {
      const { page, errors, close } = await openRecruiting({ theme });
      try {
        // Clinical Precision (level 8) starts soonest of the level 8 crimes;
        // Imitator is its heaviest role and the viewer's 77 clears the 75.
        assert.deepEqual(await picksOf(page), [
          ["2305593", "Imitator", "Best for you"],
          ["2294628", "Muscle #1", "Good for you"],
          ["2302842", "Muscle #1", "Good for you"],
        ]);

        const bar = await page.locator(BAR).innerText();
        assert.match(bar, /Best slot for you: Clinical Precision \(level 8\), Imitator\./);
        assert.match(bar, /Your CPR is 77 and the minimum is 75\./);
        assert.match(bar, /Your planning would start in about 6 hours\./);
        assert.match(bar, /2 other good slots are marked below\./);

        // Filled slots show the minimum neutrally; open ones are judged
        // against the viewer's own CPR (71 is under Muscle #3's 72).
        assert.deepEqual(await chipsOf(page, "2302842"), [
          ["Thief #2", "Min CPR 72", "filled"],
          ["Robber", "Min CPR 62", "filled"],
          ["Muscle #1", "Min CPR 63", "ok"],
          ["Muscle #2", "Min CPR 61", "ok"],
          ["Muscle #3", "Min CPR 72", "below"],
          ["Thief #1", "Min CPR 50", "ok"],
        ]);

        // "Ship Happens" is not in the site's catalog: nothing is claimed.
        assert.ok((await chipsOf(page, "2294630")).every(([, chip]) => chip === null));

        for (const selector of [
          `${BAR} .nfh-oc-bar-text`,
          `${BAR} .nfh-oc-bar-label`,
          `${BAR} .nfh-oc-bar-button`,
          ".nfh-oc-min--ok",
          ".nfh-oc-min--below",
          ".nfh-oc-min--filled",
          ".nfh-oc-pick--best > .nfh-oc-tag",
          ".nfh-oc-pick--good > .nfh-oc-tag",
        ]) {
          const { ratio } = await measureContrast(page, selector);
          assert.ok(ratio >= 4.5, `${selector} contrast ${ratio.toFixed(2)} in ${theme}`);
        }

        assert.deepEqual(errors, []);

        await screenshot(page.locator("#faction-crimes"), `oc-recruiting-${theme}`);
        await screenshot(page.locator('[data-oc-id="2305593"]'), `oc-recruiting-best-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("suggests nothing while Torn has every Join button disabled", async () => {
    const { page, errors, close } = await openRecruiting({ before: undefined });
    try {
      assert.match(await page.locator(BAR).innerText(), /Torn is not letting you join a crime right now/);
      assert.deepEqual(await picksOf(page), []);
      assert.equal((await chipsOf(page, "2302842"))[4][2], "below", "minimums are still shown");
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("follows the faction's own minimums", async () => {
    const routes = loadApiFixture();
    const config = structuredClone(routes["GET /oc/config"]);
    for (const crime of config.data.crimes) {
      for (const role of crime.roles) role.min_cpr = 99;
    }
    const { page, close } = await openRecruiting({ api: { "GET /oc/config": config } });
    try {
      assert.match(await page.locator(BAR).innerText(), /None of the open slots loaded so far meets/);
      assert.deepEqual(await picksOf(page), []);
    } finally {
      await close();
    }
  });

  it("re-reads the list when Torn loads more crimes or a slot fills", async () => {
    const { page, errors, close } = await openRecruiting();
    try {
      // The best slot is taken by someone else: Torn re-renders that crime.
      await page.evaluate(() => {
        const crime = document.querySelector('[data-oc-id="2305593"]');
        const filled = crime.querySelector('[class^="slotBody___"] [class^="badgeContainer___"]').closest('[class^="slotBody___"]');
        for (const slot of crime.querySelectorAll('[class*="waitingJoin___"]')) {
          slot.querySelector('[class^="slotBody___"]').replaceWith(filled.cloneNode(true));
        }
      });
      await page.waitForFunction(
        () => !document.querySelector('[data-oc-id="2305593"] .nfh-oc-pick'),
      );
      assert.equal((await picksOf(page))[0][0], "2294628");
      assert.match(await page.locator(BAR).innerText(), /Best slot for you: Break the Bank/);

      // Torn lazy-loads another crime at the bottom of the list.
      await page.evaluate(() => {
        const source = document.querySelector('[data-oc-id="2310877"]');
        const copy = source.cloneNode(true);
        copy.setAttribute("data-oc-id", "9999999");
        for (const ours of copy.querySelectorAll(".nfh-oc-min, .nfh-oc-tag")) ours.remove();
        source.parentElement.append(copy);
      });
      await page.waitForSelector('[data-oc-id="9999999"] .nfh-oc-min');
      assert.equal(
        await page.locator(".nfh-oc-min").count(),
        await page.evaluate(() => new Set([...document.querySelectorAll(".nfh-oc-min")].map((chip) => chip.parentElement)).size),
        "no slot gets two chips",
      );
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("scrolls to the best slot from the bar", async () => {
    const { page, close } = await openRecruiting({ viewport: { width: 1280, height: 500 } });
    try {
      await page.locator(`${BAR} [data-nfh-oc-show]`).click();
      await page.waitForFunction(() => {
        const box = document.querySelector(".nfh-oc-pick--best").getBoundingClientRect();
        return box.top >= 0 && box.bottom <= window.innerHeight;
      });
    } finally {
      await close();
    }
  });

  it("draws nothing for someone outside the family", async () => {
    const { page, errors, close } = await openTornPage(browser, {
      page: "factions-crimes-recruiting",
      before: enableJoining,
      api: { "GET /oc/config": respond(403, { error: "not a home faction" }) },
    });
    try {
      await page.waitForTimeout(600);
      assert.equal(await page.locator(`${BAR}, .nfh-oc-min, .nfh-oc-tag`).count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });
});

describe("OC Assistant on the Planning tab", () => {
  for (const theme of THEMES) {
    it(`shows minimums but suggests nothing (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, { page: "factions-crimes-planning", theme });
      try {
        await page.waitForSelector(`${ROOT} .nfh-oc-min`);
        assert.equal(await page.locator(BAR).count(), 0);
        assert.equal(await page.locator(".nfh-oc-pick").count(), 0);
        assert.deepEqual((await chipsOf(page, "2269984")).map(([, , state]) => state), Array(6).fill("filled"));
        assert.deepEqual(errors, []);
        await screenshot(page.locator('[data-oc-id="2269984"]'), `oc-planning-${theme}`);
      } finally {
        await close();
      }
    });
  }
});
