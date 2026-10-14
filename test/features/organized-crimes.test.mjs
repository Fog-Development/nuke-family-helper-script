import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, loadApiFixture, openTornPage, respond, screenshot } from "../harness/torn.js";
import { contrastRatio, measureContrast, THEMES } from "../harness/theme.js";

const BAR = "#nfh-oc-bar";
const ROOT = "#faction-crimes-root";

// With nothing to say, the bar is only there for its Settings button.
async function assertQuietBar(page) {
  assert.match(await page.locator(BAR).innerText(), /^OC Assistant\s*Settings$/i);
}

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

        // "Ship Happens" is too new for the site's catalog: its slots go on
        // the level's fallback minimum, and it ranks after the level 8 crimes
        // whose weights are known, so it is not among the three marked.
        assert.deepEqual((await chipsOf(page, "2294630")).slice(3), [
          ["Engineer", "Min CPR 60", "ok"],
          ["Interrogator", "Min CPR 60", "ok"],
        ]);

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

  for (const theme of THEMES) {
    it(`says what is wrong with the best slot when nothing would start in time (${theme})`, async () => {
      const config = structuredClone(loadApiFixture()["GET /oc/config"]);
      config.data.settings.productive_threshold_hours = 1;
      // Only the level 8 crimes stay within reach, and each has members ahead.
      for (const crime of config.data.crimes) {
        if (crime.level < 8) for (const role of crime.roles) role.min_cpr = 99;
      }
      const { page, errors, close } = await openRecruiting({ theme, api: { "GET /oc/config": config } });
      try {
        // Best first: the tags come back in page order.
        const picks = (await picksOf(page)).sort((a, b) => b[2].localeCompare(a[2]));
        assert.match(picks[0][2], /^Best available⏳ \d+h wait$/);
        for (const pick of picks.slice(1)) assert.match(pick[2], /^Also available⏳ \d+h wait$/);

        const bar = await page.locator(BAR).innerText();
        assert.match(bar, /Best slot available: /);
        assert.match(bar, /That is later than the 1 hours that count as productive, but nothing open would start you sooner\./);
        assert.doesNotMatch(bar, /good slot/);

        const { ratio } = await measureContrast(page, ".nfh-oc-pick--best > .nfh-oc-tag > .nfh-oc-flag");
        assert.ok(ratio >= 4.5, `caveat contrast ${ratio.toFixed(2)} in ${theme}`);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(`[data-oc-id="${picks[0][0]}"]`), `oc-recruiting-late-${theme}`);
        await screenshot(page.locator(BAR), `oc-recruiting-late-bar-${theme}`);
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
    for (const level of Object.keys(config.data.fallback_min_cpr)) config.data.fallback_min_cpr[level] = 99;
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
      assert.deepEqual(
        (await picksOf(page)).find(([, , tag]) => tag === "Best for you"),
        ["2294628", "Muscle #1", "Best for you"],
      );
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

  it("suggests a crime too new to have weights when it is the best on offer", async () => {
    const routes = loadApiFixture();
    const config = structuredClone(routes["GET /oc/config"]);
    // Every other level 7+ crime is out of the viewer's reach.
    for (const crime of config.data.crimes) {
      if (crime.level >= 7) for (const role of crime.roles) role.min_cpr = 99;
    }
    const { page, errors, close } = await openRecruiting({ api: { "GET /oc/config": config } });
    try {
      assert.deepEqual((await picksOf(page))[0], ["2294630", "Interrogator", "Best for you"]);
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /Best slot for you: Ship Happens \(level 8\), Interrogator\./);
      assert.match(bar, /too new to have role weights, so this goes on your CPR and its level alone/);
      assert.deepEqual(errors, []);
      await screenshot(page.locator('[data-oc-id="2294630"]'), "oc-recruiting-unweighted");
    } finally {
      await close();
    }
  });

  it("names a better slot in a crime Torn has not loaded yet", async () => {
    const board = {
      data: {
        synced_at: 1900000000,
        me: { player_id: 1, level: 9, cprs: { hostiletakeover: { muscle: 80, hacker: 50 } } },
        crimes: [
          {
            id: 7000001, name: "Hostile Takeover", key: "hostiletakeover", level: 9, status: "Recruiting",
            slots: [
              { role: "Engineer", role_key: "engineer", position_id: "P2", player_id: 4001, progress: 1, cpr: 70 },
              { role: "Muscle", role_key: "muscle", position_id: "P5", player_id: null, progress: 0, cpr: null },
              { role: "Hacker", role_key: "hacker", position_id: "P3", player_id: null, progress: 0, cpr: null },
              { role: "Negotiator", role_key: "negotiator", position_id: "P6", player_id: null, progress: 0, cpr: null },
            ],
          },
          // Already on the page: the page's own reading of it wins.
          { id: 2305593, name: "Clinical Precision", key: "clinicalprecision", level: 8, status: "Recruiting", slots: [
            { role: "Imitator", role_key: "imitator", position_id: "P1", player_id: null, progress: 0, cpr: null },
          ] },
          { id: 7000002, name: "Hostile Takeover", key: "hostiletakeover", level: 9, status: "Planning", slots: [
            { role: "Muscle", role_key: "muscle", position_id: "P5", player_id: 4002, progress: 0.2, cpr: 75 },
          ] },
        ],
      },
    };
    const { page, errors, apiCalls, close } = await openRecruiting({ api: { "GET /oc/board": board } });
    try {
      await page.waitForFunction(() => /Hostile Takeover/.test(document.querySelector("#nfh-oc-bar").innerText));
      const bar = await page.locator(BAR).innerText();
      // Level 9 with no minimum set falls back to 60; the viewer's known 80 as Muscle clears it,
      // their 50 as Hacker does not, and their CPR as Negotiator is not known at all.
      assert.match(bar, /Best slot for you: Hostile Takeover \(level 9\), Muscle\. Your CPR is 80 and the minimum is 60\./);
      assert.match(bar, /further down the list and may have been taken in the last few minutes/);
      assert.equal(await page.locator(`${BAR} [data-nfh-oc-show]`).innerText(), "Scroll down");
      // Nothing on the page is "best", and the loaded crimes are level 8:
      // below a level 9 member, so not good alternatives either.
      assert.deepEqual(await picksOf(page), []);
      assert.equal(apiCalls.filter((call) => call.path === "/oc/board").length, 1);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("sends the viewer's own CPRs to the site once", async () => {
    const { page, apiCalls, errors, close } = await openRecruiting();
    try {
      await page.waitForFunction(() => {
        const state = JSON.parse(localStorage.getItem("nfhOcCprs") || "null");
        return state && Object.keys(state.sent).length > 0;
      }, null, { timeout: 10000 });
      const uploads = apiCalls.filter((call) => call.path === "/oc/cpr");
      assert.equal(uploads.length, 1);
      const sent = JSON.parse(uploads[0].data).cprs;
      // Open slots only: a filled slot shows its occupant's CPR, not the viewer's.
      assert.deepEqual(
        sent.filter((entry) => entry.crime === "Clinical Precision"),
        [
          { crime: "Clinical Precision", role: "Assassin", cpr: 78 },
          { crime: "Clinical Precision", role: "Cleaner", cpr: 78 },
          { crime: "Clinical Precision", role: "Imitator", cpr: 77 },
        ],
      );
      assert.ok(sent.some((entry) => entry.crime === "Ship Happens" && entry.role === "Engineer" && entry.cpr === 72));

      // Nothing changed, so a re-render sends nothing more.
      await page.evaluate(() => document.querySelector("#faction-crimes-root").append(document.createElement("div")));
      await page.waitForTimeout(5000);
      assert.equal(apiCalls.filter((call) => call.path === "/oc/cpr").length, 1);
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

// Flags under each slot of a crime: [role, [flag texts]].
const flagsOf = (page, crimeId) =>
  page.evaluate((id) => {
    const crime = document.querySelector(`[data-oc-id="${id}"]`);
    return [...crime.querySelectorAll('button[class^="slotHeader___"]')].map((header) => [
      header.querySelector('[class^="title___"]').textContent.trim(),
      [...header.parentElement.querySelectorAll(":scope > .nfh-oc-flags .nfh-oc-flag")].map((flag) =>
        flag.textContent.replace(/^\S+\s/, ""),
      ),
    ]);
  }, crimeId);

// What the site sends staff: every member's level (here, one level 8 member
// who is sitting in a level 5 crime).
const staffBoard = (extra = {}) => ({
  data: {
    synced_at: 1900000000,
    crimes: [],
    me: { player_id: 1, level: 8, cprs: {} },
    members: { 100124: { name: "Member100124", level: 8 }, 100012: { name: "Member100012", level: 6 } },
    ...extra,
  },
});

describe("OC Assistant crime requests", () => {
  // A level 9 member: nothing on this page is level 8 or above with weights
  // they qualify for once level 8 minimums are out of reach.
  const levelNine = { data: { synced_at: 1900000000, crimes: [], me: { player_id: 1, level: 9, cprs: {} } } };
  const outOfReach = () => {
    const config = structuredClone(loadApiFixture()["GET /oc/config"]);
    for (const crime of config.data.crimes) {
      if (crime.level >= 7) for (const role of crime.roles) role.min_cpr = 99;
    }
    config.data.fallback_min_cpr = { default: 99 };
    return config;
  };

  it("offers to ask staff when nothing decent is open at the member's level", async () => {
    const { page, apiCalls, errors, close } = await openRecruiting({
      api: { "GET /oc/board": levelNine, "GET /oc/config": outOfReach() },
    });
    try {
      const button = page.locator(`${BAR} [data-nfh-oc-spawn]`);
      await button.waitFor();
      assert.equal(await button.innerText(), "Ask staff for a level 7-8 crime");
      // What they do qualify for is level 6 and under: none of it is marked.
      assert.match(await page.locator(BAR).innerText(), /The open slots you qualify for are all in crimes below your level, so none is suggested\./);
      assert.deepEqual(await picksOf(page), []);
      await screenshot(page.locator(BAR), "oc-spawn-offer");

      await button.click();
      await page.waitForFunction(() => /Staff have been asked for a level 7-8 crime\./.test(document.querySelector("#nfh-oc-bar").innerText));
      assert.equal(apiCalls.filter((call) => call.method === "POST" && call.path === "/oc/spawn-request").length, 1);
      assert.equal(await page.locator(`${BAR} [data-nfh-oc-spawn]`).count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("marks the best lower crime as only available when the member cannot ask", async () => {
    const off = outOfReach();
    off.data.settings.spawn_requests_enabled = false;
    const { page, errors, close } = await openRecruiting({ api: { "GET /oc/board": levelNine, "GET /oc/config": off } });
    try {
      await page.waitForFunction(() => /Best slot available:/.test(document.querySelector("#nfh-oc-bar").innerText));
      const picks = await picksOf(page);
      assert.deepEqual(picks.map((pick) => pick[2]), ["Best available\u2B07 Below your level"]);
      assert.match(await page.locator(BAR).innerText(), /This crime is below your level \(9\)\./);
      assert.equal(await page.locator(`${BAR} [data-nfh-oc-spawn]`).count(), 0);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "oc-best-available");
    } finally {
      await close();
    }
  });

  for (const level of [9, 10]) {
    it(`suggests a level 8 crime to a level ${level} member with no crime of their own level open, with no flag or request`, async () => {
      // Level 9 and 10 crimes are not spawned directly, so a level 8 that
      // starts in time is where such a member belongs.
      const board = { data: { ...levelNine.data, me: { player_id: 1, level, cprs: {} } } };
      const { page, errors, close } = await openRecruiting({ api: { "GET /oc/board": board } });
      try {
        await page.waitForFunction(() => /Best slot for you/.test(document.querySelector("#nfh-oc-bar").innerText));
        const picks = await picksOf(page);
        assert.deepEqual(picks[0], ["2305593", "Imitator", "Best for you"]);
        const bar = await page.locator(BAR).innerText();
        assert.match(bar, /Best slot for you: Clinical Precision \(level 8\), Imitator\./);
        assert.doesNotMatch(bar, /below your level|Nothing decent/);
        assert.equal(await page.locator(`${BAR} [data-nfh-oc-spawn]`).count(), 0);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(BAR), `oc-level-${level}-drops-to-8`);
      } finally {
        await close();
      }
    });
  }

  it("flags a crime one level down as a last resort and still offers to ask staff", async () => {
    // A level 8 member with every level 8 role out of reach: the best open
    // slot is a level 7.
    const config = structuredClone(loadApiFixture()["GET /oc/config"]);
    for (const crime of config.data.crimes) {
      if (crime.level >= 8) for (const role of crime.roles) role.min_cpr = 99;
    }
    config.data.fallback_min_cpr = { default: 99 };
    const board = { data: { ...levelNine.data, me: { player_id: 1, level: 8, cprs: {} } } };
    const { page, errors, close } = await openRecruiting({ api: { "GET /oc/board": board, "GET /oc/config": config } });
    try {
      await page.locator(`${BAR} [data-nfh-oc-spawn]`).waitFor();
      const picks = await picksOf(page);
      assert.deepEqual(picks.map((pick) => pick[2]), ["Best available\u2B07 Below your level"]);
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /Best slot available: .+ \(level 7\)/);
      assert.match(bar, /This crime is below your level \(8\)\./);
      assert.match(bar, /Nothing decent is open at your level\./);
      assert.equal(await page.locator(`${BAR} [data-nfh-oc-spawn]`).innerText(), "Ask staff for a level 7-8 crime");
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "oc-below-level-bar");
      await screenshot(page.locator(`[data-oc-id="${picks[0][0]}"]`), "oc-below-level-slot");
    } finally {
      await close();
    }
  });

  it("shows the site's reason when the request is refused", async () => {
    const { page, close } = await openRecruiting({
      api: {
        "GET /oc/board": levelNine,
        "GET /oc/config": outOfReach(),
        "POST /oc/spawn-request": respond(429, { error: "You have already asked in the last 30 minutes." }),
      },
    });
    try {
      await page.locator(`${BAR} [data-nfh-oc-spawn]`).click();
      await page.waitForFunction(() => /You have already asked in the last 30 minutes\./.test(document.querySelector("#nfh-oc-bar").innerText));
    } finally {
      await close();
    }
  });

  it("is not offered when a decent slot exists, the faction has it off, or the member is below the level", async () => {
    const off = outOfReach();
    off.data.settings.spawn_requests_enabled = false;
    for (const api of [
      { "GET /oc/board": { data: { ...levelNine.data, me: { player_id: 1, level: 8, cprs: {} } } } },
      { "GET /oc/board": levelNine, "GET /oc/config": off },
      { "GET /oc/board": { data: { ...levelNine.data, me: { player_id: 1, level: 5, cprs: {} } } }, "GET /oc/config": outOfReach() },
      { "GET /oc/config": outOfReach() },
    ]) {
      const { page, close } = await openRecruiting({ api });
      try {
        await page.waitForTimeout(700);
        assert.equal(await page.locator(`${BAR} [data-nfh-oc-spawn]`).count(), 0, JSON.stringify(Object.keys(api)));
      } finally {
        await close();
      }
    }
  });
});

describe("OC Assistant staff flags", () => {
  for (const theme of THEMES) {
    it(`marks each kind of problem differently on the Planning tab (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, {
        page: "factions-crimes-planning",
        theme,
        api: { "GET /oc/board": staffBoard() },
      });
      try {
        await page.waitForSelector(".nfh-oc-flag");

        // Blast from the Past: the Muscle's 69 is under the minimum of 77.
        assert.deepEqual((await flagsOf(page, "2265157")).filter(([, flags]) => flags.length), [["Muscle", ["CPR 69 < 77"]]]);
        // Window of Opportunity: the last to join waits on two members ahead.
        assert.deepEqual((await flagsOf(page, "2294629")).at(-1), ["Muscle #2", ["Idle 27h"]]);
        // Honey Trap (level 5): a level 8 member, and one waiting 36 hours.
        // The level 6 member beside them is within the two-level gap.
        assert.deepEqual(await flagsOf(page, "2275218"), [
          ["Enforcer", []],
          ["Muscle #1", ["Level 8 member"]],
          ["Muscle #2", ["Idle 36h"]],
        ]);

        const bar = await page.locator(BAR).innerText();
        assert.match(bar, /Staff flags on this page:\s+\d+ unqualified, \d+ not productive, 1 under-levelled/);
        assert.doesNotMatch(bar, /Best slot for you/, "the Planning tab suggests nothing");
        assert.equal(await page.locator(".nfh-oc-pick").count(), 0);

        for (const selector of [".nfh-oc-flag--unqualified", ".nfh-oc-flag--unproductive", ".nfh-oc-flag--underlevel", `${BAR} .nfh-oc-staff`]) {
          const { ratio } = await measureContrast(page, selector);
          assert.ok(ratio >= 4.5, `${selector} contrast ${ratio.toFixed(2)} in ${theme}`);
        }
        const colours = await page.evaluate(() =>
          ["unqualified", "unproductive", "underlevel"].map(
            (kind) => getComputedStyle(document.querySelector(`.nfh-oc-flag--${kind}`)).backgroundColor,
          ),
        );
        assert.equal(new Set(colours).size, 3);

        assert.deepEqual(errors, []);
        await screenshot(page.locator('[data-oc-id="2275218"]'), `oc-flags-${theme}`);
        await page.locator(`${BAR} [data-nfh-oc-settings-toggle]`).click();
        await page.waitForSelector(`${BAR} .nfh-oc-staff-panel`);
        await screenshot(page.locator(BAR), `oc-flags-settings-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("lets a staff member hide a kind of flag and use their own thresholds", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-crimes-planning",
      api: { "GET /oc/board": staffBoard() },
    });
    try {
      await page.waitForSelector(".nfh-oc-flag");
      await page.locator(`${BAR} [data-nfh-oc-settings-toggle]`).click();

      await page.locator(`${BAR} [data-nfh-oc-flag="unqualified"]`).uncheck();
      await page.waitForFunction(() => !document.querySelector(".nfh-oc-flags .nfh-oc-flag--unqualified"));
      assert.match(await page.locator(`${BAR} .nfh-oc-staff`).innerText(), /page:\s+\d+ not productive, 1 under-levelled/);

      // 27 hours of waiting is fine by this staff member; 36 is still not.
      await page.locator(`${BAR} [data-nfh-oc-limit="thresholdHours"]`).fill("30");
      await page.locator(`${BAR} [data-nfh-oc-limit="thresholdHours"]`).blur();
      await page.waitForFunction(() => !document.querySelector('[data-oc-id="2294629"] .nfh-oc-flag'));
      assert.deepEqual((await flagsOf(page, "2275218"))[2], ["Muscle #2", ["Idle 36h"]]);

      // A wider gap clears the under-levelled flag; blank goes back to the faction's.
      const gap = page.locator(`${BAR} [data-nfh-oc-limit="levelGap"]`);
      await gap.fill("4");
      await gap.blur();
      await page.waitForFunction(() => !document.querySelector(".nfh-oc-flags .nfh-oc-flag--underlevel"));
      await page.locator(`${BAR} [data-nfh-oc-limit="levelGap"]`).fill("");
      await page.locator(`${BAR} [data-nfh-oc-limit="levelGap"]`).blur();
      await page.waitForSelector(".nfh-oc-flags .nfh-oc-flag--underlevel");

      assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("nfhOcStaffPrefs"))), {
        show: { unqualified: false, unproductive: true, underlevel: true },
        thresholdHours: 30,
        levelGap: null,
      });
    } finally {
      await close();
    }
  });

  it("shows flags on the Recruiting tab too, beside the member's own suggestion", async () => {
    const { page, errors, close } = await openRecruiting({ api: { "GET /oc/board": staffBoard() } });
    try {
      await page.waitForSelector(".nfh-oc-flag");
      // Bidding War: four members queued behind one who is half done.
      assert.deepEqual((await flagsOf(page, "2296934")).map(([, flags]) => flags), [[], [], ["Idle 35h"], ["Idle 59h"], ["Idle 83h"], []]);
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /Best slot for you: Clinical Precision/);
      assert.match(bar, /Staff flags on this page:/);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("shows nothing of the kind to a member who is not staff", async () => {
    const { page, close } = await openTornPage(browser, { page: "factions-crimes-planning" });
    try {
      await page.waitForSelector(`${ROOT} .nfh-oc-min`);
      await page.waitForTimeout(500);
      assert.equal(await page.locator(".nfh-oc-flag").count(), 0);
      await assertQuietBar(page);
      await page.locator(`${BAR} [data-nfh-oc-settings-toggle]`).click();
      await page.waitForSelector(`${BAR} [data-nfh-oc-weights]`);
      assert.equal(await page.locator(`${BAR} [data-nfh-oc-flag]`).count(), 0);
    } finally {
      await close();
    }
  });
});

describe("OC Assistant for a member already in a crime", () => {
  // Torn leaves the Join buttons live for a member in a crime, and the crime
  // stays on Recruiting until it fills: put the viewer (player 1) in Clinical
  // Precision's filled slot.
  const joinedClinicalPrecision = async (page) => {
    await enableJoining(page);
    await page.evaluate(() => {
      const link = document.querySelector('[data-oc-id="2305593"] a[href*="profiles.php?XID="]');
      link.setAttribute("href", "/profiles.php?XID=1");
    });
  };
  const levelEight = { data: { synced_at: 1900000000, crimes: [], me: { player_id: 1, level: 8, cprs: {} } } };

  it("suggests nothing more and does not offer a crime request", async () => {
    const { page, errors, close } = await openRecruiting({
      before: joinedClinicalPrecision,
      api: { "GET /oc/board": levelEight },
    });
    try {
      await page.waitForFunction(() => /You are in/.test(document.querySelector("#nfh-oc-bar").innerText));
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /You are in Clinical Precision \(level 8\) as Cat Burglar, so no other slot is suggested\./);
      assert.doesNotMatch(bar, /Best slot|Nothing decent/);
      assert.deepEqual(await picksOf(page), []);
      assert.equal(await page.locator(`${BAR} [data-nfh-oc-spawn]`).count(), 0);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "oc-already-joined");
    } finally {
      await close();
    }
  });

  it("believes the page over a board that still has them in a crime they left", async () => {
    // The board (a few minutes old) lists the viewer in Clinical Precision;
    // on the page that slot is someone else's.
    const stale = structuredClone(levelEight);
    stale.data.crimes = [
      { id: 2305593, name: "Clinical Precision", key: "clinicalprecision", level: 8, status: "Recruiting", slots: [
        { role: "Cat Burglar", role_key: "catburglar", position_id: "P1", player_id: 1, progress: 0.5, cpr: 72 },
      ] },
    ];
    const { page, close } = await openRecruiting({ api: { "GET /oc/board": stale } });
    try {
      await page.waitForFunction(() => /Best slot for you/.test(document.querySelector("#nfh-oc-bar").innerText));
      assert.equal((await picksOf(page)).length, 3);
    } finally {
      await close();
    }
  });
});

describe("OC Assistant warning about your own slot", () => {
  // The viewer (player 1) sits in a level 5 crime, last in a long queue.
  const ownCrime = (slots) => ({
    synced_at: 1900000000,
    me: { player_id: 1, level: 8, cprs: {} },
    crimes: [{ id: 7000009, name: "Honey Trap", key: "honeytrap", level: 5, status: "Planning", slots }],
  });
  const slot = (role, playerId, progress, cpr) => ({ role, role_key: role, position_id: "P1", player_id: playerId, progress, cpr });

  it("warns a member in a bad slot and suggests better ones", async () => {
    const board = { data: ownCrime([slot("Enforcer", 4001, 0.1, 80), slot("Muscle #1", 4002, 0, 80), slot("Muscle #2", 1, 0, 60)]) };
    // Join stays disabled, as Torn has it for a member already in a crime.
    const { page, errors, close } = await openRecruiting({ before: undefined, api: { "GET /oc/board": board } });
    try {
      await page.waitForFunction(() => /You are in Honey Trap/.test(document.querySelector("#nfh-oc-bar").innerText));
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /You are in Honey Trap as Muscle #2, but: CPR 60 is below the faction's minimum of 72 for this role\./);
      assert.match(bar, /later than the 12 hour threshold\./);
      assert.match(bar, /This member qualifies for level 8 crimes; this one is level 5\./);
      assert.match(bar, /A better slot: Clinical Precision \(level 8\), Imitator\./);
      assert.equal((await picksOf(page)).length, 3);
      // The warning wraps over several lines, so its box holds other text too:
      // compare its colour with the bar's own background instead of sampling.
      const [fg, bg] = await page.evaluate(() => {
        const rgb = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        return [
          rgb(getComputedStyle(document.querySelector("#nfh-oc-bar .nfh-oc-bar-warning")).color),
          rgb(getComputedStyle(document.querySelector("#nfh-oc-bar")).backgroundColor),
        ];
      });
      assert.ok(contrastRatio(fg, bg) >= 4.5, `warning contrast ${contrastRatio(fg, bg).toFixed(2)}`);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "oc-own-slot-warning");
    } finally {
      await close();
    }
  });

  it("says nothing when the crime is nearly done, or the slot is fine", async () => {
    for (const slots of [
      // Under 24 hours left: not worth leaving, whatever is wrong with the slot.
      [slot("Enforcer", 4001, 1, 80), slot("Muscle #1", 4002, 1, 80), slot("Muscle #2", 1, 0.5, 60)],
    ]) {
      const { page, close } = await openRecruiting({ before: undefined, api: { "GET /oc/board": { data: ownCrime(slots) } } });
      try {
        await page.waitForFunction(() => /You are in Honey Trap/.test(document.querySelector("#nfh-oc-bar").innerText));
        assert.match(await page.locator(BAR).innerText(), /You are in Honey Trap \(level 5\) as Muscle #2, so no other slot is suggested\./);
        assert.deepEqual(await picksOf(page), []);
      } finally {
        await close();
      }
    }
  });
});

describe("OC Assistant with parts switched off by the faction", () => {
  const configWith = (settings) => {
    const config = structuredClone(loadApiFixture()["GET /oc/config"]);
    Object.assign(config.data.settings, settings);
    return config;
  };
  const slot = (role, playerId, progress, cpr) => ({ role, role_key: role, position_id: "P1", player_id: playerId, progress, cpr });
  // The viewer sits last in a level 5 crime, with a CPR under its minimum.
  const badSlot = {
    data: {
      synced_at: 1900000000,
      me: { player_id: 1, level: 8, cprs: {} },
      crimes: [
        {
          id: 7000009, name: "Honey Trap", key: "honeytrap", level: 5, status: "Planning",
          slots: [slot("Enforcer", 4001, 0.1, 80), slot("Muscle #1", 4002, 0, 80), slot("Muscle #2", 1, 0, 60)],
        },
      ],
    },
  };
  const weightChips = [
    ["Thief #2", "Weight 29.1%", "weight"],
    ["Robber", "Weight 12.7%", "weight"],
    ["Muscle #1", "Weight 13.5%", "weight"],
    ["Muscle #2", "Weight 10.1%", "weight"],
    ["Muscle #3", "Weight 31.7%", "weight"],
    ["Thief #1", "Weight 2.9%", "weight"],
  ];

  for (const theme of THEMES) {
    it(`shows only each role's weight when the assistant is off (${theme})`, async () => {
      const { page, apiCalls, errors, close } = await openTornPage(browser, {
        page: "factions-crimes-recruiting",
        theme,
        before: enableJoining,
        api: { "GET /oc/config": configWith({ assistant_enabled: false, show_role_weights: true }) },
      });
      try {
        await page.waitForSelector(`${ROOT} .nfh-oc-min`);
        await assertQuietBar(page);
        assert.deepEqual(await picksOf(page), []);
        assert.deepEqual(await chipsOf(page, "2302842"), weightChips);
        // "Ship Happens" has no weights yet, so there is nothing to show on it.
        assert.deepEqual((await chipsOf(page, "2294630")).map(([, text]) => text), Array(5).fill(null));
        assert.equal(await page.locator(".nfh-oc-min--ok, .nfh-oc-min--below, .nfh-oc-min--filled").count(), 0);

        const { ratio } = await measureContrast(page, ".nfh-oc-min--weight");
        assert.ok(ratio >= 4.5, `weight contrast ${ratio.toFixed(2)} in ${theme}`);

        // The viewer's CPRs still go to the site, for staff and for later.
        await page.waitForFunction(() => {
          const state = JSON.parse(localStorage.getItem("nfhOcCprs") || "null");
          return state && Object.keys(state.sent).length > 0;
        }, null, { timeout: 10000 });
        assert.equal(apiCalls.filter((call) => call.path === "/oc/cpr").length, 1);
        assert.deepEqual(errors, []);
        await screenshot(page.locator('[data-oc-id="2302842"]'), `oc-weights-only-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("leaves staff their flags when the assistant is off", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-crimes-planning",
      api: { "GET /oc/board": staffBoard(), "GET /oc/config": configWith({ assistant_enabled: false, show_role_weights: true }) },
    });
    try {
      await page.waitForSelector(".nfh-oc-flag");
      assert.deepEqual((await flagsOf(page, "2265157")).filter(([, flags]) => flags.length), [["Muscle", ["CPR 69 < 77"]]]);
      assert.match(await page.locator(BAR).innerText(), /Staff flags on this page:/);
      assert.equal(await page.locator(".nfh-oc-min--weight").count() > 0, true);
    } finally {
      await close();
    }
  });

  it("never offers a crime request when the assistant is off", async () => {
    const config = configWith({ assistant_enabled: false });
    for (const crime of config.data.crimes) {
      if (crime.level >= 7) for (const role of crime.roles) role.min_cpr = 99;
    }
    config.data.fallback_min_cpr = { default: 99 };
    const board = { data: { synced_at: 1900000000, crimes: [], me: { player_id: 1, level: 9, cprs: {} } } };
    const { page, close } = await openTornPage(browser, {
      page: "factions-crimes-recruiting",
      before: enableJoining,
      api: { "GET /oc/board": board, "GET /oc/config": config },
    });
    try {
      await page.waitForSelector(BAR);
      await page.waitForTimeout(700);
      await assertQuietBar(page);
    } finally {
      await close();
    }
  });

  it("keeps minimums and warnings but marks no slot when suggestions are off", async () => {
    const config = configWith({ suggest_slots: false });
    const free = await openTornPage(browser, {
      page: "factions-crimes-recruiting",
      before: enableJoining,
      api: { "GET /oc/config": config },
    });
    try {
      await free.page.waitForSelector(`${ROOT} .nfh-oc-min`);
      await free.page.waitForTimeout(700);
      await assertQuietBar(free.page);
      assert.deepEqual(await picksOf(free.page), []);
      assert.deepEqual((await chipsOf(free.page, "2302842"))[4], ["Muscle #3", "Min CPR 72", "below"]);
    } finally {
      await free.close();
    }

    const { page, errors, close } = await openRecruiting({ before: undefined, api: { "GET /oc/board": badSlot, "GET /oc/config": config } });
    try {
      await page.waitForFunction(() => /You are in Honey Trap/.test(document.querySelector("#nfh-oc-bar").innerText));
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /You are in Honey Trap as Muscle #2, but: CPR 60 is below the faction's minimum of 72 for this role\./);
      assert.doesNotMatch(bar, /A better slot|Best slot for you|Show me/);
      assert.deepEqual(await picksOf(page), []);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "oc-warning-without-suggestions");
    } finally {
      await close();
    }
  });

  it("still asks staff for a crime when suggestions are off", async () => {
    const config = configWith({ suggest_slots: false });
    for (const crime of config.data.crimes) {
      if (crime.level >= 7) for (const role of crime.roles) role.min_cpr = 99;
    }
    config.data.fallback_min_cpr = { default: 99 };
    const board = { data: { synced_at: 1900000000, crimes: [], me: { player_id: 1, level: 9, cprs: {} } } };
    const { page, close } = await openRecruiting({ api: { "GET /oc/board": board, "GET /oc/config": config } });
    try {
      const button = page.locator(`${BAR} [data-nfh-oc-spawn]`);
      await button.waitFor();
      assert.equal(await button.innerText(), "Ask staff for a level 7-8 crime");
      assert.doesNotMatch(await page.locator(BAR).innerText(), /None of the open slots|Best slot for you/);
    } finally {
      await close();
    }
  });

  it("does not warn a member about their own slot when warnings are off", async () => {
    const { page, close } = await openRecruiting({
      before: undefined,
      api: { "GET /oc/board": badSlot, "GET /oc/config": configWith({ warn_poor_slot: false }) },
    });
    try {
      await page.waitForTimeout(700);
      assert.match(await page.locator(BAR).innerText(), /You are in Honey Trap \(level 5\) as Muscle #2, so no other slot is suggested\./);
      assert.deepEqual(await picksOf(page), []);
    } finally {
      await close();
    }
  });

  it("shows weights where minimums are hidden only when the weights are on", async () => {
    const hiddenSettings = { show_min_cpr: false, suggest_slots: false, warn_poor_slot: false };
    const hidden = await openTornPage(browser, {
      page: "factions-crimes-recruiting",
      before: enableJoining,
      api: { "GET /oc/config": configWith({ ...hiddenSettings, show_role_weights: true }) },
    });
    try {
      await hidden.page.waitForSelector(`${ROOT} .nfh-oc-min`);
      assert.deepEqual(await chipsOf(hidden.page, "2302842"), weightChips);
    } finally {
      await hidden.close();
    }

    // Minimums hidden and weights off: each role shows nothing at all.
    const bare = await openTornPage(browser, {
      page: "factions-crimes-recruiting",
      before: enableJoining,
      api: { "GET /oc/config": configWith(hiddenSettings) },
    });
    try {
      await bare.page.waitForSelector(BAR);
      await bare.page.waitForTimeout(500);
      assert.equal(await bare.page.locator(".nfh-oc-min").count(), 0);
    } finally {
      await bare.close();
    }

    const { page, close } = await openRecruiting({ api: { "GET /oc/config": configWith({ show_min_cpr: false }) } });
    try {
      assert.deepEqual((await chipsOf(page, "2302842"))[4], ["Muscle #3", "Min CPR 72", "below"]);
      assert.equal((await picksOf(page)).length, 3);
    } finally {
      await close();
    }
  });
});

describe("OC Assistant role weights", () => {
  const configWith = (settings) => {
    const config = structuredClone(loadApiFixture()["GET /oc/config"]);
    Object.assign(config.data.settings, settings);
    return config;
  };
  const weightsBox = `${BAR} [data-nfh-oc-weights]`;
  const openSettings = async (page) => {
    await page.locator(`${BAR} [data-nfh-oc-settings-toggle]`).click();
    await page.waitForSelector(weightsBox);
  };
  const muscle3 = async (page) => {
    await page.waitForSelector('[data-oc-id="2302842"] .nfh-oc-min');
    return (await chipsOf(page, "2302842"))[4];
  };

  for (const theme of THEMES) {
    it(`adds the weight beside the minimum when the faction shows them (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, {
        page: "factions-crimes-planning",
        theme,
        api: { "GET /oc/config": configWith({ show_role_weights: true }) },
      });
      try {
        await page.waitForSelector(`${ROOT} .nfh-oc-min-weight`);
        const [, text, state] = (await chipsOf(page, "2269984"))[0];
        assert.match(text, /^Min CPR \d+ · \d+\.\d%$/);
        assert.equal(state, "filled");
        const { ratio } = await measureContrast(page, ".nfh-oc-min-weight");
        assert.ok(ratio >= 4.5, `weight contrast ${ratio.toFixed(2)} in ${theme}`);

        await openSettings(page);
        assert.equal(await page.locator(weightsBox).isChecked(), true);
        assert.match(await page.locator(BAR).innerText(), /Your faction shows them by default\./);
        assert.deepEqual(errors, []);
        await screenshot(page.locator('[data-oc-id="2269984"]'), `oc-min-and-weight-${theme}`);
        await screenshot(page.locator(BAR), `oc-settings-weights-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("starts with weights hidden, as every faction does until it changes that", async () => {
    const { page, close } = await openRecruiting();
    try {
      assert.deepEqual(await muscle3(page), ["Muscle #3", "Min CPR 72", "below"]);
      await openSettings(page);
      assert.equal(await page.locator(weightsBox).isChecked(), false);
      assert.match(await page.locator(BAR).innerText(), /Your faction hides them by default\./);
    } finally {
      await close();
    }
  });

  it("lets a member turn weights on against the faction, and go back to its choice", async () => {
    const { page, errors, close } = await openRecruiting();
    try {
      await openSettings(page);
      await page.locator(weightsBox).check();
      await page.waitForFunction(() => document.querySelector(".nfh-oc-min-weight"));
      assert.deepEqual(await muscle3(page), ["Muscle #3", "Min CPR 72 · 31.7%", "below"]);
      assert.match(await page.locator(BAR).innerText(), /You changed this\. Your faction hides them by default\./);
      assert.deepEqual(
        await page.evaluate(() => JSON.parse(localStorage.getItem("nfhOcWeights"))),
        { show: true, factionId: 5678 },
      );
      await screenshot(page.locator(BAR), "oc-settings-weights-changed-dark");

      await page.locator(`${BAR} [data-nfh-oc-weights-reset]`).click();
      await page.waitForFunction(() => !document.querySelector(".nfh-oc-min-weight"));
      assert.equal(await page.locator(weightsBox).isChecked(), false);
      assert.doesNotMatch(await page.locator(BAR).innerText(), /You changed this/);
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("lets a member hide weights their faction shows", async () => {
    const { page, close } = await openRecruiting({
      api: { "GET /oc/config": configWith({ show_role_weights: true }) },
      localStorage: { nfhOcWeights: JSON.stringify({ show: false, factionId: 5678 }) },
    });
    try {
      assert.deepEqual(await muscle3(page), ["Muscle #3", "Min CPR 72", "below"]);
    } finally {
      await close();
    }
  });

  it("drops a choice made in another faction", async () => {
    const { page, close } = await openRecruiting({
      localStorage: { nfhOcWeights: JSON.stringify({ show: true, factionId: 1111 }) },
    });
    try {
      assert.deepEqual(await muscle3(page), ["Muscle #3", "Min CPR 72", "below"]);
      await page.waitForFunction(() => localStorage.getItem("nfhOcWeights") === "null");
    } finally {
      await close();
    }
  });
});

describe("OC Assistant below the level productive days count from", () => {
  const configFrom = (level) => {
    const config = structuredClone(loadApiFixture()["GET /oc/config"]);
    config.data.settings.productive_from_level = level;
    return config;
  };

  it("flags nobody as not productive there, for staff", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-crimes-planning",
      api: { "GET /oc/board": staffBoard(), "GET /oc/config": configFrom(7) },
    });
    try {
      await page.waitForSelector(".nfh-oc-flag");
      // Honey Trap is level 5: the 36 hour wait no longer counts, the level 8 member still does.
      assert.deepEqual(await flagsOf(page, "2275218"), [
        ["Enforcer", []],
        ["Muscle #1", ["Level 8 member"]],
        ["Muscle #2", []],
      ]);
      // Blast from the Past is level 7, where the rest still applies.
      assert.deepEqual((await flagsOf(page, "2265157")).filter(([, flags]) => flags.length), [["Muscle", ["CPR 69 < 77"]]]);
    } finally {
      await close();
    }
  });

  it("leaves the wait out of a suggestion when the faction never counts productive days", async () => {
    const { page, errors, close } = await openRecruiting({ api: { "GET /oc/config": configFrom(null) } });
    try {
      const bar = await page.locator(BAR).innerText();
      assert.match(bar, /Best slot for you: /);
      assert.doesNotMatch(bar, /Your planning would start|Nothing open would start you sooner/);
      assert.match(
        await page.locator(".nfh-oc-pick--best > .nfh-oc-tag").getAttribute("title"),
        /Productive days do not count at this level/,
      );
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
        await assertQuietBar(page);
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
