import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { gotoStep, launch, loadPageFixture, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// Recruiting score badges on Torn's Applications page, the player search and
// another faction's member list. Scores are made up; ids are read from the
// captures so no names are written here.

const PERMITTED = { "GET /user/get-own-permissions": { permissions: ["recruiting.predict"] } };

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

const unique = (ids) => [...new Set(ids.map(Number))];

// Applicants: the name links in the Person cells of Torn's applications list.
function applicantIds(fixture, step = 0) {
  const html = loadPageFixture(fixture, step);
  const list = html.slice(html.indexOf('id="faction-applications-root"'));
  return unique([...list.matchAll(/person___[^"]*"><div class="userInfoBox[\s\S]*?href="\/profiles\.php\?XID=(\d+)"/g)].map((match) => match[1]));
}

// Search results: one `a.user.name` per row.
function searchIds(step = 0) {
  const html = loadPageFixture("search-results", step);
  const list = html.slice(html.indexOf('class="user-info-list-wrap'));
  return unique([...list.matchAll(/class="user name" href="\/profiles\.php\?XID=(\d+)"/g)].map((match) => match[1]));
}

// Another faction's members: the honor-bar name links in its member table.
function factionMemberIds() {
  const html = loadPageFixture("faction-profile-other", 0);
  const list = html.slice(html.indexOf('class="table-body"'));
  return unique([...list.matchAll(/class="honorWrap[^"]*"><a[^>]*href="\/profiles\.php\?XID=(\d+)"/g)].map((match) => match[1]));
}

function score(id, composite, extra = {}) {
  return {
    player_id: id,
    feature_set: "public",
    model_trained_at: "2026-11-20 04:00:00",
    composite,
    activity: 71,
    kick_safety: 84,
    retention: 45,
    combat: 20,
    explanation: {
      kick_safety: { up: [{ label: "Xanax Taken", value: 1200 }], down: [{ label: "Net Worth (log)", value: 12.8 }] },
      activity: { up: [{ label: "Time Online / day", value: 300 }], down: [] },
    },
    ...extra,
  };
}

const slot = (id) => `.nfh-rs-slot[data-player="${id}"]`;

function applicantsApi(first, second) {
  return {
    ...PERMITTED,
    "POST /candidate-score/applicants": (details) => ({
      applicants: JSON.parse(details.data).player_ids.map((id) =>
        id === first
          ? { ...score(id, 72), state: "scored", application_id: 901, application_status: "active", scored_at: "2026-11-25T22:30:38Z" }
          : id === second
            ? { player_id: id, state: "unscored", application_id: 902, application_status: "active" }
            : { player_id: id, state: "unknown" },
      ),
    }),
    "GET /candidate-score/applications/902": score(second, 30),
  };
}

describe("recruiting scores on the Applications page", () => {
  for (const theme of THEMES) {
    it(`badges applicants with their logged score and opens the reasons (${theme})`, async () => {
      const ids = applicantIds("controls-applications");
      assert.ok(ids.length >= 3, "the capture lists applicants");
      const [first, second, third] = ids;
      const api = { ...applicantsApi(first, second), [`GET /candidate-score/${third}`]: score(third, 55) };
      const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "controls-applications", theme, api });
      try {
        await page.waitForSelector(`${slot(first)} .nfh-rs-badge`);
        const asked = apiCalls.filter((call) => call.path === "/candidate-score/applicants");
        assert.equal(asked.length, 1, "one request for the whole list");
        assert.deepEqual(JSON.parse(asked[0].data).player_ids, ids, "the applicants and nobody else");
        const badge = page.locator(`${slot(first)} .nfh-rs-badge`);
        assert.match(await badge.innerText(), /^72\s*KS84\s*A71\s*R45\s*C20$/);
        assert.match(await page.locator(slot(first)).getAttribute("title"), /Kick safety 84/);
        assert.equal(await page.locator(`${slot(second)} [data-rs-action="score-application"]`).innerText(), "Score");
        assert.equal(await page.locator(`${slot(third)} [data-rs-action="check"]`).innerText(), "Check score");
        const { ratio } = await measureContrast(page, `${slot(first)} .nfh-rs-sub--ks`);
        assert.ok(ratio >= 4.5, `kick safety contrast ${ratio.toFixed(2)} in ${theme}`);
        // The badge stays inside the Person cell.
        const fits = await page.evaluate((selector) => {
          const slotBox = document.querySelector(selector).getBoundingClientRect();
          const cell = document.querySelector(selector).closest('[class*="person___"]').getBoundingClientRect();
          return slotBox.right <= cell.right + 1;
        }, slot(first));
        assert.ok(fits, "badge fits the Person cell");
        await screenshot(page.locator("#faction-applications-root"), `recruiting-applications-${theme}`);

        await badge.click();
        const detail = page.locator(`.nfh-rs-detail[data-player="${first}"]`);
        await detail.waitFor();
        const text = await detail.innerText();
        assert.match(text, /Recruiting Score: 72\/100/);
        assert.match(text, /Kick Safety:\s*84/);
        assert.match(text, /▲ Xanax Taken/);
        assert.match(text, /scored 2026-11-25/);
        await screenshot(detail.locator(".."), `recruiting-applicant-${theme}`);

        // The unscored application: scored on a click, then opened.
        await page.click(`${slot(second)} [data-rs-action="score-application"]`);
        await page.waitForSelector(`${slot(second)} .nfh-rs-badge`);
        assert.ok(apiCalls.some((call) => call.path === "/candidate-score/applications/902"));
        await page.locator(`.nfh-rs-detail[data-player="${second}"]`).waitFor();

        // One the site hasn't seen: the profile check.
        await page.click(`${slot(third)} [data-rs-action="check"]`);
        await page.waitForSelector(`${slot(third)} .nfh-rs-badge`);
        assert.ok(apiCalls.some((call) => call.path === `/candidate-score/${third}`));

        await page.click(`.nfh-rs-detail[data-player="${first}"] [data-rs-action="close"]`);
        await detail.waitFor({ state: "detached" });
        assert.deepEqual(errors, []);
      } finally {
        await close();
      }
    });
  }

  it("keeps its badges when Torn opens an application's details", async () => {
    const ids = applicantIds("controls-applications");
    const { page, apiCalls, close } = await openTornPage(browser, { page: "controls-applications", api: applicantsApi(ids[0], ids[1]) });
    try {
      await page.waitForSelector(`${slot(ids[0])} .nfh-rs-badge`);
      await gotoStep(page, "controls-applications", 1);
      await page.waitForSelector(`${slot(ids[0])} .nfh-rs-badge`);
      assert.equal(await page.locator(".nfh-rs-slot").count(), ids.length, "one slot per applicant, none for links in a message");
      assert.equal(apiCalls.filter((call) => call.path === "/candidate-score/applicants").length, 1, "nothing asked again");
    } finally {
      await close();
    }
  });

  it("shows only the composite and kick safety in the phone layout", async () => {
    const ids = applicantIds("controls-applications-mobile");
    const { page, errors, close } = await openTornPage(browser, { page: "controls-applications-mobile", theme: "dark", api: applicantsApi(ids[0], ids[1]) });
    try {
      await page.waitForSelector(`${slot(ids[0])} .nfh-rs-badge`);
      assert.match(await page.locator(`${slot(ids[0])} .nfh-rs-badge`).innerText(), /^72\s*KS84$/);
      assert.equal(await page.locator(`${slot(ids[0])} .nfh-rs-sub:not(.nfh-rs-sub--ks)`).first().isVisible(), false);
      for (const id of ids) {
        const placed = await page.evaluate((selector) => {
          const element = document.querySelector(selector);
          const row = element.closest('[class*="rowWrapper___"]').getBoundingClientRect();
          const tableRow = element.previousElementSibling;
          const box = element.getBoundingClientRect();
          return tableRow?.matches('[class*="tableRow___"]') && box.top >= tableRow.getBoundingClientRect().bottom - 1 && box.bottom <= row.bottom + 1 && box.right <= row.right + 1;
        }, slot(id));
        assert.ok(placed, `slot on its own line under the row at phone width (${id})`);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(overflow, false, "no sideways scroll");
      await page.locator(`${slot(ids[0])} .nfh-rs-badge`).click();
      await page.locator(`.nfh-rs-detail[data-player="${ids[0]}"]`).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, "the reasons panel fits too");
      await screenshot(page.locator("#faction-applications-root"), "recruiting-applications-mobile");
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("shows nothing without the recruiting permission", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, { page: "controls-applications" });
    try {
      await page.waitForTimeout(1500);
      assert.equal(await page.locator(".nfh-rs-slot").count(), 0);
      assert.ok(!apiCalls.some((call) => call.path.startsWith("/candidate-score")));
    } finally {
      await close();
    }
  });
});

function bulkApi(ids, { cached, slow, broken }, track = {}) {
  track.polls = 0;
  return {
    ...PERMITTED,
    "POST /candidate-score/bulk": (details) => {
      const asked = JSON.parse(details.data).player_ids;
      return respond(201, { id: 77, status: "queued", total: asked.length, done: 1, results: [{ ...score(cached, 81), position: 0, seq: 1, state: "scored" }] });
    },
    "GET /candidate-score/bulk/77": (details) => {
      track.polls += 1;
      const after = Number(new URL(details.url).searchParams.get("after"));
      if (track.polls === 1) {
        assert.equal(after, 1);
        return { id: 77, status: "running", total: ids.length, done: 2, results: [{ ...score(slow, 40), position: 1, seq: 2, state: "scored" }] };
      }
      assert.equal(after, 2);
      return {
        id: 77,
        status: "completed",
        total: ids.length,
        done: ids.length,
        results: [
          { player_id: broken, position: 2, seq: 3, state: "failed", error: "Torn could not be read for this player." },
          ...ids.slice(3).map((id, n) => ({ ...score(id, 60), position: n + 3, seq: n + 4, state: "scored" })),
        ],
      };
    },
  };
}

describe("Score this page", () => {
  for (const theme of THEMES) {
    it(`scores search results only on a click and draws badges as results arrive (${theme})`, async () => {
      const ids = searchIds(0);
      assert.ok(ids.length >= 4, "the capture lists players");
      const [cached, slow, broken] = ids;
      const track = {};
      const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "search-results", theme, api: bulkApi(ids, { cached, slow, broken }, track) });
      try {
        const button = page.locator('#nfh-rs-bar [data-rs-bar="score"]');
        await button.waitFor();
        assert.equal(await button.innerText(), `Score this page (${ids.length})`);
        assert.equal(await page.evaluate(() => document.getElementById("nfh-rs-bar").nextElementSibling?.classList.contains("userlist-wrapper")), true, "the bar sits right above the results");
        await page.waitForTimeout(600);
        assert.ok(!apiCalls.some((call) => call.path.startsWith("/candidate-score")), "nothing is asked for before the click");
        await screenshot(page.locator("#nfh-rs-bar"), `recruiting-bulk-bar-${theme}`);

        await button.click();
        await page.waitForSelector(`${slot(cached)} .nfh-rs-badge`);
        assert.equal(await page.locator(`${slot(slow)} .nfh-rs-note`).innerText(), "…");
        assert.match(await page.locator("#nfh-rs-bar").innerText(), new RegExp(`Scoring 1 of ${ids.length}`));
        const sent = JSON.parse(apiCalls.find((call) => call.path === "/candidate-score/bulk").data);
        assert.deepEqual(sent, { player_ids: ids, page: "search" }, "the result rows only (not the married-to links in their icons)");

        await page.waitForSelector(`${slot(slow)} .nfh-rs-badge`, { timeout: 6000 });
        await page.waitForSelector(`${slot(broken)} .nfh-rs-note`, { timeout: 6000 });
        await page.waitForFunction(() => /Scored/.test(document.getElementById("nfh-rs-bar")?.innerText || ""));
        assert.equal(await page.locator(`${slot(broken)} .nfh-rs-note`).innerText(), "?");
        assert.match(await page.locator("#nfh-rs-bar").innerText(), new RegExp(`Scored ${ids.length - 1} of ${ids.length} \\(1 couldn't be read\\)`));
        assert.equal(await page.locator('#nfh-rs-bar [data-rs-bar="score"]').innerText(), "Score 1 more", "the failed one can be asked for again");
        const wrapped = await page.evaluate(() =>
          [...document.querySelectorAll(".user-info-list-wrap .nfh-rs-slot")].filter((slot) => {
            const name = slot.previousElementSibling.getBoundingClientRect();
            return Math.abs(slot.getBoundingClientRect().top + slot.offsetHeight / 2 - (name.top + name.height / 2)) > 6;
          }).length,
        );
        assert.equal(wrapped, 0, "every badge stays on its name's line");
        await screenshot(page.locator(".userlist-wrapper"), `recruiting-search-${theme}`);

        await page.locator(`${slot(slow)} .nfh-rs-badge`).click();
        await page.locator(`.nfh-rs-detail[data-player="${slow}"]`).waitFor();
        await screenshot(page.locator(`.nfh-rs-detail[data-player="${slow}"]`).locator(".."), `recruiting-bulk-detail-${theme}`);
        await page.waitForTimeout(2500);
        assert.equal(track.polls, 2, "polling stops once the lookup is done");
        assert.deepEqual(errors, []);
      } finally {
        await close();
      }
    });
  }

  it("offers the next page's players once the search moves on", async () => {
    const first = searchIds(0);
    const second = searchIds(1);
    const api = {
      ...PERMITTED,
      "POST /candidate-score/bulk": (details) => {
        const asked = JSON.parse(details.data).player_ids;
        return respond(201, { id: 5, status: "completed", total: asked.length, done: asked.length, results: asked.map((id, n) => ({ ...score(id, 50), position: n, seq: n + 1, state: "scored" })) });
      },
    };
    const { page, apiCalls, close } = await openTornPage(browser, { page: "search-results", api });
    try {
      await page.click('#nfh-rs-bar [data-rs-bar="score"]');
      await page.waitForSelector(`${slot(first[0])} .nfh-rs-badge`);
      await gotoStep(page, "search-results", 1);
      const fresh = second.filter((id) => !first.includes(id));
      // None of page 2 is scored yet (or only some of it, when the pages overlap).
      await page.waitForFunction(
        ([n, overlap]) => document.querySelector('#nfh-rs-bar [data-rs-bar="score"]')?.innerText === (overlap ? `Score ${n} more` : `Score this page (${n})`),
        [fresh.length, fresh.length !== second.length],
      );
      await page.click('#nfh-rs-bar [data-rs-bar="score"]');
      await page.waitForSelector(`${slot(fresh[0])} .nfh-rs-badge`);
      const posts = apiCalls.filter((call) => call.path === "/candidate-score/bulk");
      assert.deepEqual(JSON.parse(posts[1].data).player_ids, fresh, "only players not scored yet");
    } finally {
      await close();
    }
  });

  it("scores another faction's members and nothing else on its page", async () => {
    const ids = factionMemberIds();
    assert.ok(ids.length >= 10, "the capture lists members");
    const api = {
      ...PERMITTED,
      "POST /candidate-score/bulk": (details) => {
        const asked = JSON.parse(details.data).player_ids;
        return respond(201, { id: 6, status: "completed", total: asked.length, done: asked.length, results: asked.map((id, n) => ({ ...score(id, 65), position: n, seq: n + 1, state: "scored" })) });
      },
    };
    const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "faction-profile-other", theme: "dark", api });
    try {
      const button = page.locator('#nfh-rs-bar [data-rs-bar="score"]');
      await button.waitFor();
      assert.equal(await page.evaluate(() => document.getElementById("nfh-rs-bar").nextElementSibling?.classList.contains("members-list")), true, "the bar sits right above the member list");
      await button.click();
      await page.waitForSelector(`${slot(ids[0])} .nfh-rs-badge`);
      assert.deepEqual(JSON.parse(apiCalls.find((call) => call.path === "/candidate-score/bulk").data).player_ids, ids.slice(0, 100));
      const overflowing = await page.evaluate(() =>
        [...document.querySelectorAll(".members-list .table-body .nfh-rs-slot")].filter(
          (slot) => slot.getBoundingClientRect().right > slot.closest(".table-cell").getBoundingClientRect().right + 1,
        ).length,
      );
      assert.equal(overflowing, 0, "every badge fits its member cell");
      await screenshot(page.locator(".faction-info-wrap .members-list"), "recruiting-faction-members");
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("says why nuke.family turned a page down", async () => {
    const api = {
      ...PERMITTED,
      "POST /candidate-score/bulk": respond(429, { error: "Too many pages scored. Try again in about 4 min.", retry_after: 200 }),
    };
    const { page, close } = await openTornPage(browser, { page: "search-results", api });
    try {
      await page.click('#nfh-rs-bar [data-rs-bar="score"]');
      await page.waitForSelector("#nfh-rs-bar .nfh-cw-error");
      assert.equal(await page.locator("#nfh-rs-bar .nfh-cw-error").innerText(), "Too many pages scored. Try again in about 4 min.");
      assert.equal(await page.locator(".nfh-rs-slot").count(), 0);
    } finally {
      await close();
    }
  });

  it("is not offered without the permission", async () => {
    const { page, close } = await openTornPage(browser, { page: "search-results" });
    try {
      await page.waitForTimeout(1500);
      assert.equal(await page.locator("#nfh-rs-bar").count(), 0);
    } finally {
      await close();
    }
  });
});
