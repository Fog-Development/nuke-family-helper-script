import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, loadPageFixture, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// Recruiting score badges. There is no capture of the Applications page, Recruit
// Citizens, the Hall of Fame or the player search yet (asked for in
// fixtures/wanted.json), so these open the Members list capture at those pages'
// URLs: a real Torn list of players with honor-bar name links, which is all the
// badges rely on. Scores are made up; ids are read from the capture.

const PERMITTED = { "GET /user/get-own-permissions": { permissions: ["recruiting.predict"] } };
const APPLICATIONS_URL = "https://www.torn.com/factions.php?step=your&type=1#/tab=controls&option=application";
const RECRUIT_URL = "https://www.torn.com/bringafriend.php";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

function memberIds() {
  const html = loadPageFixture("controls-members", 0);
  const start = html.indexOf('id="option-members-root"');
  const ids = [...html.slice(start).matchAll(/class="honorWrap[^"]*"[^>]*><a[^>]*href="\/profiles\.php\?XID=(\d+)"/g)].map((match) => Number(match[1]));
  return [...new Set(ids)];
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

describe("recruiting scores on the Applications page", () => {
  for (const theme of THEMES) {
    it(`badges applicants with their logged score and opens the reasons (${theme})`, async () => {
      const [first, second, third] = memberIds();
      const api = {
        ...PERMITTED,
        "POST /candidate-score/applicants": (details) => {
          const ids = JSON.parse(details.data).player_ids;
          return {
            applicants: ids.map((id) =>
              id === first
                ? { ...score(id, 72), state: "scored", application_id: 901, application_status: "active", scored_at: "2026-11-25T22:30:38Z" }
                : id === second
                  ? { player_id: id, state: "unscored", application_id: 902, application_status: "active" }
                  : { player_id: id, state: "unknown" },
            ),
          };
        },
        "GET /candidate-score/applications/902": score(second, 30),
        [`GET /candidate-score/${third}`]: score(third, 55),
      };
      const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "controls-members", url: APPLICATIONS_URL, theme, api });
      try {
        await page.waitForSelector(`${slot(first)} .nfh-rs-badge`);
        assert.equal(apiCalls.filter((call) => call.path === "/candidate-score/applicants").length, 1, "one request for the whole list");
        const badge = page.locator(`${slot(first)} .nfh-rs-badge`);
        assert.match(await badge.innerText(), /^72\s*KS84\s*A71\s*R45\s*C20$/);
        assert.match(await page.locator(slot(first)).getAttribute("title"), /Kick safety 84/);
        assert.equal(await page.locator(`${slot(second)} [data-rs-action="score-application"]`).innerText(), "Score");
        assert.equal(await page.locator(`${slot(third)} [data-rs-action="check"]`).innerText(), "Check score");
        const { ratio } = await measureContrast(page, `${slot(first)} .nfh-rs-sub--ks`);
        assert.ok(ratio >= 4.5, `kick safety contrast ${ratio.toFixed(2)} in ${theme}`);

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

  it("shows nothing without the recruiting permission", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, { page: "controls-members", url: APPLICATIONS_URL });
    try {
      await page.waitForTimeout(1500);
      assert.equal(await page.locator(".nfh-rs-slot").count(), 0);
      assert.ok(!apiCalls.some((call) => call.path.startsWith("/candidate-score")));
    } finally {
      await close();
    }
  });
});

describe("Score this page", () => {
  for (const theme of THEMES) {
    it(`scores only on a click and draws badges as results arrive (${theme})`, async () => {
      const ids = memberIds();
      assert.ok(ids.length >= 4, "the capture lists players");
      const [cached, slow, broken] = ids;
      let polls = 0;
      const api = {
        ...PERMITTED,
        "POST /candidate-score/bulk": () =>
          respond(201, { id: 77, status: "queued", total: ids.length, done: 1, results: [{ ...score(cached, 81), position: 0, seq: 1, state: "scored" }] }),
        "GET /candidate-score/bulk/77": (details) => {
          polls += 1;
          const after = Number(new URL(details.url).searchParams.get("after"));
          if (polls === 1) {
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
      const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "controls-members", url: RECRUIT_URL, theme, api });
      try {
        const button = page.locator('#nfh-rs-bar [data-rs-bar="score"]');
        await button.waitFor();
        assert.equal(await button.innerText(), `Score this page (${Math.min(ids.length, 100)})`);
        await page.waitForTimeout(600);
        assert.ok(!apiCalls.some((call) => call.path.startsWith("/candidate-score")), "nothing is asked for before the click");
        await screenshot(page.locator("#nfh-rs-bar"), `recruiting-bulk-bar-${theme}`);

        await button.click();
        // The cached player straight away, the rest as polls bring them.
        await page.waitForSelector(`${slot(cached)} .nfh-rs-badge`);
        assert.equal(await page.locator(`${slot(slow)} .nfh-rs-note`).innerText(), "…");
        assert.match(await page.locator("#nfh-rs-bar").innerText(), new RegExp(`Scoring 1 of ${ids.length}`));
        const sent = JSON.parse(apiCalls.find((call) => call.path === "/candidate-score/bulk").data);
        assert.deepEqual(sent, { player_ids: ids.slice(0, 100), page: "recruit-citizens" });

        await page.waitForSelector(`${slot(slow)} .nfh-rs-badge`, { timeout: 6000 });
        await page.waitForSelector(`${slot(broken)} .nfh-rs-note[title], ${slot(broken)}[title*="Torn could not"]`, { timeout: 6000 });
        assert.equal(await page.locator(`${slot(broken)} .nfh-rs-note`).innerText(), "?");
        assert.match(await page.locator("#nfh-rs-bar").innerText(), new RegExp(`Scored ${ids.length - 1} of ${ids.length} \\(1 couldn't be read\\)`));
        // The failed one can be asked for again.
        assert.equal(await page.locator('#nfh-rs-bar [data-rs-bar="score"]').innerText(), "Score 1 more");

        await page.locator(`${slot(slow)} .nfh-rs-badge`).click();
        await page.locator(`.nfh-rs-detail[data-player="${slow}"]`).waitFor();
        await screenshot(page.locator(`.nfh-rs-detail[data-player="${slow}"]`).locator(".."), `recruiting-bulk-detail-${theme}`);
        await page.waitForTimeout(2500);
        assert.equal(polls, 2, "polling stops once the lookup is done");
        assert.deepEqual(errors, []);
      } finally {
        await close();
      }
    });
  }

  it("says why nuke.family turned a page down", async () => {
    const api = {
      ...PERMITTED,
      "POST /candidate-score/bulk": respond(429, { error: "Too many pages scored. Try again in about 4 min.", retry_after: 200 }),
    };
    const { page, close } = await openTornPage(browser, { page: "controls-members", url: RECRUIT_URL, api });
    try {
      await page.click('#nfh-rs-bar [data-rs-bar="score"]');
      await page.waitForSelector("#nfh-rs-bar .nfh-cw-error");
      assert.equal(await page.locator("#nfh-rs-bar .nfh-cw-error").innerText(), "Too many pages scored. Try again in about 4 min.");
      assert.equal(await page.locator(".nfh-rs-slot").count(), 0);
    } finally {
      await close();
    }
  });

  it("is not offered on other pages, or without the permission", async () => {
    const { page, close } = await openTornPage(browser, { page: "controls-members", url: RECRUIT_URL });
    try {
      await page.waitForTimeout(1500);
      assert.equal(await page.locator("#nfh-rs-bar").count(), 0);
    } finally {
      await close();
    }
  });
});
