import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

const ROOT = "#nfh-chain-watch";
const HOUR = 3600 * 1000;
const WATCH_ID = 7;

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
const thisHour = () => Math.floor(Date.now() / HOUR) * HOUR;

function signup(playerId, name, over = {}) {
  return {
    user_id: playerId, player_id: playerId, player_name: name, paid: true,
    want_dm_reminder: true, want_push_reminder: false, is_me: false, ...over,
  };
}

// A board as /chain-watch/{id} returns it, built around the current hour:
// slot 0 is running. `signups` maps slot index -> signups on it.
function makeBoard({ signups = {}, checkins = [], staff = false, startsInHours = -3 } = {}) {
  const base = thisHour();
  const first = startsInHours > 0 ? base + startsInHours * HOUR : base;
  const slots = Array.from({ length: 30 }, (_, index) => {
    const start = first + index * HOUR;
    const hour = new Date(start).getUTCHours();
    const premium = hour >= 8 && hour < 12;
    const cap = 2;
    const list = signups[index] || [];
    return {
      slot_start_iso: iso(start), hour, rate: premium ? 5 : 3, cap,
      is_premium: premium, range_label: premium ? "Graveyard" : null,
      signups: list,
      paid_count: list.filter((s) => s.paid).length,
      total_count: list.length,
    };
  });
  return {
    id: WATCH_ID, title: "RW chain", faction_id: 5678, status: "active", is_finished: false,
    start_time: iso(base + startsInHours * HOUR), end_time: null,
    signup_horizon_hours: 30, default_rate: 3, default_slot_cap: 2,
    window: { from: slots[0].slot_start_iso, to: slots[29].slot_start_iso },
    ranges: [{ start_hour: 8, end_hour: 12, rate: 5, slot_cap: 2, label: "Graveyard" }],
    slots,
    signup_url: "https://nuke.family/chain-watch/7",
    attendance_url: "https://nuke.family/chain-watch/7/attendance",
    checkins,
    can_manage_attendance: staff,
  };
}

function checkin(playerId, name, over = {}) {
  return {
    id: 900 + playerId, player_id: playerId, player_name: name, discord_id: null,
    status: "scheduled", awaiting_reply: false,
    checked_in_at: iso(Date.now() - 23 * 60 * 1000), checkin_source: "site",
    is_me: false, ...over,
  };
}

// API routes for a watch whose board the test can replace as actions happen.
function watchApi(initialBoard, extra = {}) {
  const state = { board: initialBoard };
  const start = initialBoard.start_time.replace("T", " ").replace("Z", "");
  return {
    state,
    api: {
      "GET /chain-watch": { data: [{ id: WATCH_ID, title: "RW chain", start_time: start, end_time: null }] },
      [`GET /chain-watch/${WATCH_ID}`]: () => ({ data: state.board }),
      ...extra,
    },
  };
}

async function openFaction(options = {}) {
  const session = await openTornPage(browser, { page: "factions-faction", ...options });
  await session.page.waitForSelector(`${ROOT} .nfh-cw-status`);
  return session;
}

const me = { is_me: true };
const callsTo = (apiCalls, path) => apiCalls.filter((call) => call.path === path);

describe("chain watch bar", () => {
  for (const theme of THEMES) {
    it(`is a quiet single line when no watch is scheduled (${theme})`, async () => {
      const { page, errors, apiCalls, close } = await openFaction({ theme });
      try {
        assert.match(await page.locator(ROOT).innerText(), /No chain watch scheduled/);
        assert.equal(await page.locator(`${ROOT} .nfh-cw-panel`).isVisible(), false);
        assert.ok((await page.locator(ROOT).boundingBox()).height <= 34);
        assert.equal(callsTo(apiCalls, "/chain-watch").length, 1);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(ROOT), `chain-watch-none-${theme}`);
      } finally {
        await close();
      }
    });

    it(`shows the board when expanded (${theme})`, async () => {
      const { api } = watchApi(
        makeBoard({
          staff: true,
          signups: {
            0: [signup(11, "Alpha"), signup(12, "Bravo")],
            // Own slots are at least an hour out, so the bar reads "next slot"
            // whatever minute of the hour the test runs at.
            1: [signup(11, "Alpha")],
            2: [signup(11, "Alpha"), signup(1, "TestUser", me), signup(13, "Charlie", { paid: false })],
            4: [signup(1, "TestUser", me)],
          },
          checkins: [
            checkin(11, "Alpha"),
            checkin(14, "Delta", { status: "unscheduled" }),
            checkin(15, "Echo", { status: "past_slot" }),
          ],
        }),
      );
      const { page, errors, close } = await openFaction({ theme, api });
      try {
        await page.waitForSelector(`${ROOT} .nfh-cw-title`);
        assert.match(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /Your next slot/);
        await screenshot(page.locator(ROOT), `chain-watch-collapsed-${theme}`);

        await page.click(`${ROOT} .nfh-cw-toggle`);
        await page.waitForSelector(`${ROOT} .nfh-cw-slot`);
        const text = await page.locator(`${ROOT} .nfh-cw-panel`).innerText();
        assert.match(text, /Now/);
        assert.match(text, /Bravo/);
        assert.match(text, /Checked in \(3\)/);
        assert.match(text, /Past slot/);
        assert.equal(await page.locator(`${ROOT} .nfh-cw-slot`).count(), 30);
        assert.equal(await page.locator(`${ROOT} .nfh-cw-slot.is-mine`).count(), 2);
        // Bravo is scheduled now but not checked in: staff get a shortcut.
        assert.equal(await page.locator(`${ROOT} .nfh-cw-roster-row.is-now [data-action="staff-in"]`).count(), 1);

        await page.locator(`${ROOT} .nfh-cw-slot`).nth(2).click();
        assert.match(await page.locator(`${ROOT} .nfh-cw-detail`).innerText(), /Leave this slot/);

        for (const selector of [".nfh-cw-status", ".nfh-cw-heading", ".nfh-cw-roster-when", ".nfh-cw-muted"]) {
          const { ratio } = await measureContrast(page, `${ROOT} ${selector}`);
          assert.ok(ratio >= 4.5, `${selector} contrast ${ratio.toFixed(2)} in ${theme}`);
        }
        assert.deepEqual(errors, []);
        await screenshot(page.locator(ROOT), `chain-watch-expanded-${theme}`);
        await screenshot(page, `chain-watch-page-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("makes no request while the watch list cache is fresh", async () => {
    const { page, apiCalls, close } = await openFaction({
      localStorage: { nfhChainWatchList: { watches: [], timestamp: Date.now() } },
    });
    try {
      await page.waitForTimeout(300);
      assert.equal(apiCalls.filter((call) => call.path.startsWith("/chain-watch")).length, 0);
    } finally {
      await close();
    }
  });

  it("stays off other faction tabs and other factions' pages", async () => {
    for (const [fixture, url] of [
      ["factions-controls", undefined],
      ["factions-faction", "https://www.torn.com/factions.php?step=profile&ID=5678"],
    ]) {
      const { page, close } = await openTornPage(browser, { page: fixture, ...(url ? { url } : {}) });
      try {
        await page.waitForTimeout(500);
        assert.equal(await page.locator(ROOT).count(), 0, fixture);
      } finally {
        await close();
      }
    }
  });

  it("is put back after Torn rebuilds the panel", async () => {
    const { page, close } = await openFaction();
    try {
      await page.evaluate((sel) => {
        document.querySelector(sel).remove();
        history.pushState({}, "", location.pathname + location.search + "#/war/chain");
      }, ROOT);
      await page.waitForSelector(`${ROOT} .nfh-cw-status`);
      assert.equal(await page.locator(ROOT).count(), 1);
    } finally {
      await close();
    }
  });

  it("signs up for and leaves a slot", async () => {
    const withMe = makeBoard({ signups: { 3: [signup(1, "TestUser", me)] } });
    const { api, state } = watchApi(makeBoard(), {
      [`POST /chain-watch/${WATCH_ID}/signups`]: () => ({ data: (state.board = withMe) }),
      [`POST /chain-watch/${WATCH_ID}/signups?_method=DELETE`]: () => ({ data: (state.board = makeBoard()) }),
    });
    const { page, apiCalls, close } = await openFaction({ api });
    try {
      await page.click(`${ROOT} .nfh-cw-toggle`);
      const slot = page.locator(`${ROOT} .nfh-cw-slot`).nth(3);
      await slot.click();
      await page.click(`${ROOT} [data-action="signup"]`);
      await page.waitForSelector(`${ROOT} .nfh-cw-slot.is-mine`);
      const claim = callsTo(apiCalls, `/chain-watch/${WATCH_ID}/signups`)[0];
      assert.deepEqual(JSON.parse(claim.data), {
        slot_start: withMe.slots[3].slot_start_iso,
        want_dm_reminder: true,
      });
      assert.match(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /Signed up for/);

      await page.click(`${ROOT} [data-action="leave"]`);
      await page.waitForFunction((sel) => !document.querySelector(`${sel} .nfh-cw-slot.is-mine`), ROOT);
      const leave = callsTo(apiCalls, `/chain-watch/${WATCH_ID}/signups?_method=DELETE`)[0];
      assert.equal(leave.method, "POST");
      assert.equal(JSON.parse(leave.data).slot_start, withMe.slots[3].slot_start_iso);
    } finally {
      await close();
    }
  });

  it("checks in and out from the collapsed bar, and shows API errors", async () => {
    const running = { 0: [signup(1, "TestUser", me)] };
    const { api, state } = watchApi(makeBoard({ signups: running }), {
      [`POST /chain-watch/${WATCH_ID}/checkin`]: () => ({
        data: (state.board = makeBoard({ signups: running, checkins: [checkin(1, "TestUser", me)] })),
      }),
      [`POST /chain-watch/${WATCH_ID}/checkout`]: () => respond(422, { error: "You are not checked in." }),
    });
    const { page, apiCalls, close } = await openFaction({ api });
    try {
      await page.waitForSelector(`${ROOT}.nfh-cw--attn`);
      assert.match(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /Your slot is running/);
      await screenshot(page.locator(ROOT), "chain-watch-attention");

      await page.click(`${ROOT} [data-action="checkin"]`);
      await page.waitForSelector(`${ROOT}.nfh-cw--in`);
      assert.deepEqual(JSON.parse(callsTo(apiCalls, `/chain-watch/${WATCH_ID}/checkin`)[0].data), { source: "userscript" });

      await page.click(`${ROOT} [data-action="checkout"]`);
      await page.waitForSelector(`${ROOT} .nfh-cw-error`);
      assert.match(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /You are not checked in/);
    } finally {
      await close();
    }
  });

  it("asks a watcher whose slot ended whether they are staying", async () => {
    const past = makeBoard({ checkins: [checkin(1, "TestUser", { ...me, status: "past_slot" })] });
    const { api, state } = watchApi(past, {
      [`POST /chain-watch/${WATCH_ID}/checkins/901/respond`]: () => {
        state.board = makeBoard({ checkins: [checkin(1, "TestUser", { ...me, status: "unscheduled" })] });
        return { data: { ok: true } };
      },
    });
    const { page, apiCalls, close } = await openFaction({ api });
    try {
      await page.waitForSelector(`${ROOT} [data-action="stay"]`);
      assert.match(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /Still watching/);
      await page.click(`${ROOT} [data-action="stay"]`);
      await page.waitForSelector(`${ROOT}.nfh-cw--in`);
      const call = callsTo(apiCalls, `/chain-watch/${WATCH_ID}/checkins/901/respond`)[0];
      assert.deepEqual(JSON.parse(call.data), { action: "stay" });
    } finally {
      await close();
    }
  });

  it("lets staff find a member and check them in; hides that from members", async () => {
    const { api, state } = watchApi(makeBoard({ staff: true }), {
      [`GET /chain-watch/${WATCH_ID}/members?q=fox`]: {
        data: [{ player_id: 21, player_name: "<b>Foxtrot</b>", checked_in: false }],
      },
      [`POST /chain-watch/${WATCH_ID}/checkin`]: () => ({
        data: (state.board = makeBoard({ staff: true, checkins: [checkin(21, "<b>Foxtrot</b>", { status: "unscheduled" })] })),
      }),
    });
    const { page, apiCalls, errors, close } = await openFaction({ api });
    try {
      await page.click(`${ROOT} .nfh-cw-toggle`);
      await page.fill(`${ROOT} [data-role="member-search"]`, "fox");
      await page.click(`${ROOT} .nfh-cw-staff [data-action="staff-in"]`);
      await page.waitForFunction((sel) => /Checked in \(1\)/.test(document.querySelector(sel).innerText), ROOT);
      assert.deepEqual(JSON.parse(callsTo(apiCalls, `/chain-watch/${WATCH_ID}/checkin`)[0].data), { source: "userscript", player_id: 21 });
      // API strings are escaped, not rendered.
      assert.equal(await page.locator(`${ROOT} b`).count(), 0);
      assert.match(await page.locator(`${ROOT} .nfh-cw-panel`).innerText(), /<b>Foxtrot<\/b>/);
      // The result now offers the opposite action, and typing kept its focus.
      await page.waitForSelector(`${ROOT} .nfh-cw-staff [data-action="staff-out"]`);
      assert.equal(await page.inputValue(`${ROOT} [data-role="member-search"]`), "fox");
      assert.deepEqual(errors, []);
      await screenshot(page.locator(ROOT), "chain-watch-staff");
    } finally {
      await close();
    }

    const member = await openFaction({ api: watchApi(makeBoard()).api });
    try {
      await member.page.click(`${ROOT} .nfh-cw-toggle`);
      await member.page.waitForSelector(`${ROOT} .nfh-cw-slot`);
      assert.equal(await member.page.locator(`${ROOT} [data-role="member-search"]`).count(), 0);
    } finally {
      await member.close();
    }
  });

  it("drops a watch that has finished", async () => {
    const { api } = watchApi({ ...makeBoard(), is_finished: true });
    const { page, close } = await openFaction({ api });
    try {
      await page.waitForFunction(
        (sel) => /No chain watch scheduled/.test(document.querySelector(sel).innerText),
        ROOT,
      );
    } finally {
      await close();
    }
  });
});

// Put Torn's chain box into a given state (the fixture has no active chain).
async function setChain(page, title, timeLeft, hits = "1,250") {
  await page.evaluate(
    ([t, left, count]) => {
      document.querySelector(".chain-box-title").textContent = t;
      document.querySelector(".chain-box-timeleft").textContent = left;
      document.querySelector(".chain-box-center-stat").textContent = count;
    },
    [title, timeLeft, hits],
  );
}

describe("chain timer alert", () => {
  it("flashes while an active chain is under the threshold", async () => {
    const { page, errors, close } = await openFaction({
      localStorage: { nfhChainWatch: { alertMode: "always", alertSeconds: 150, color: "#00ff00", opacity: 0.4 } },
    });
    try {
      await setChain(page, "Chain active", "04:10");
      await page.waitForTimeout(1300);
      assert.equal(await page.locator("#nfh-chain-flash").count(), 0);

      await setChain(page, "Chain active", "02:29");
      await page.waitForSelector("#nfh-chain-flash", { state: "attached" });
      assert.equal(
        await page.locator("#nfh-chain-flash").evaluate((el) => el.style.backgroundColor),
        "rgba(0, 255, 0, 0.4)",
      );
      // The overlay must never swallow clicks.
      await page.click(`${ROOT} [data-action="settings"]`);
      await page.waitForSelector(`${ROOT} .nfh-cw-settings select`);
      await screenshot(page, "chain-watch-alerting");

      // A cooldown or finished chain is not an alert.
      await setChain(page, "Chain cooldown", "02:00");
      await page.waitForSelector("#nfh-chain-flash", { state: "detached" });
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("is on by default for any active chain, with or without a chain watch", async () => {
    const { page, close } = await openFaction();
    try {
      assert.equal(await page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 1);
      await setChain(page, "Chain active", "01:00");
      await page.waitForSelector("#nfh-chain-flash", { state: "attached" });
    } finally {
      await close();
    }
  });

  it("can be limited to while checked in, and that choice is kept", async () => {
    const mine = { 0: [signup(1, "TestUser", me)] };
    const { api, state } = watchApi(makeBoard({ signups: mine }), {
      [`POST /chain-watch/${WATCH_ID}/checkin`]: () => ({
        data: (state.board = makeBoard({ signups: mine, checkins: [checkin(1, "TestUser", me)] })),
      }),
    });
    const { page, close } = await openFaction({ api });
    try {
      await page.click(`${ROOT} [data-action="settings"]`);
      await page.selectOption(`${ROOT} [data-pref="alertMode"]`, "checkedin");
      assert.equal(
        await page.evaluate(() => JSON.parse(localStorage.getItem("nfhChainWatch")).alertMode),
        "checkedin",
      );

      await setChain(page, "Chain active", "01:00");
      await page.waitForTimeout(1300);
      assert.equal(await page.locator("#nfh-chain-flash").count(), 0);
      assert.equal(await page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 0);

      await page.click(`${ROOT} [data-action="checkin"]`);
      await page.waitForSelector("#nfh-chain-flash", { state: "attached" });
      assert.equal(await page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 1);
    } finally {
      await close();
    }
  });

  it("ignores a chain until it reaches 25 hits", async () => {
    const { page, close } = await openFaction();
    try {
      await setChain(page, "Chain active", "01:00", "24");
      await page.waitForTimeout(1300);
      assert.equal(await page.locator("#nfh-chain-flash").count(), 0);

      await setChain(page, "Chain active", "01:00", "25");
      await page.waitForSelector("#nfh-chain-flash", { state: "attached" });
    } finally {
      await close();
    }
  });

  it("can be limited to chains the faction has set up a chain watch for", async () => {
    const prefs = { localStorage: { nfhChainWatch: { alertMode: "watch" } } };

    const without = await openFaction(prefs);
    try {
      await setChain(without.page, "Chain active", "01:00");
      await without.page.waitForTimeout(1300);
      assert.equal(await without.page.locator("#nfh-chain-flash").count(), 0);
      assert.equal(await without.page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 0);
      assert.match(
        await without.page.locator(`${ROOT} .nfh-cw-chip`).getAttribute("title"),
        /no chain watch set up/,
      );
    } finally {
      await without.close();
    }

    // With a watch set up it alerts without being checked in.
    const withWatch = await openFaction({ ...prefs, api: watchApi(makeBoard()).api });
    try {
      await setChain(withWatch.page, "Chain active", "01:00");
      await withWatch.page.waitForSelector("#nfh-chain-flash", { state: "attached" });
      assert.equal(await withWatch.page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 1);
    } finally {
      await withWatch.close();
    }
  });

  it("explains what the chosen alert mode means", async () => {
    const { page, close } = await openFaction();
    try {
      await page.click(`${ROOT} [data-action="settings"]`);
      const help = page.locator(`${ROOT} .nfh-cw-help`);
      assert.match(await help.innerText(), /whether or not a chain watch exists/);
      await page.selectOption(`${ROOT} [data-pref="alertMode"]`, "watch");
      assert.match(await help.innerText(), /only when both are true/);
      await page.selectOption(`${ROOT} [data-pref="alertMode"]`, "checkedin");
      assert.match(await help.innerText(), /all three are true/);
      assert.equal(await page.inputValue(`${ROOT} [data-pref="alertMode"]`), "checkedin");
      const { ratio } = await measureContrast(page, `${ROOT} .nfh-cw-help`);
      assert.ok(ratio >= 4.5, `help contrast ${ratio.toFixed(2)}`);
      await screenshot(page.locator(ROOT), "chain-watch-alert-modes");
    } finally {
      await close();
    }
  });

  it("uses the saved alert choice on the next page load", async () => {
    const { page, close } = await openFaction({
      localStorage: { nfhChainWatch: { alertMode: "checkedin" } },
    });
    try {
      await page.click(`${ROOT} [data-action="settings"]`);
      assert.equal(await page.inputValue(`${ROOT} [data-pref="alertMode"]`), "checkedin");
      assert.equal(await page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 0);
    } finally {
      await close();
    }
  });

  it("nudges someone watching a live chain to check in to the running chain watch", async () => {
    const { api, state } = watchApi(makeBoard(), {
      [`POST /chain-watch/${WATCH_ID}/checkin`]: () => ({
        data: (state.board = makeBoard({ checkins: [checkin(1, "TestUser", me)] })),
      }),
    });
    const { page, close } = await openFaction({ api });
    try {
      await page.waitForSelector(`${ROOT} .nfh-cw-title`);
      assert.doesNotMatch(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /Not checked in/);

      await setChain(page, "Chain active", "04:30");
      await page.waitForFunction(
        (sel) => /Not checked in/.test(document.querySelector(`${sel} .nfh-cw-status`).innerText),
        ROOT,
      );
      await screenshot(page.locator(ROOT), "chain-watch-nudge");

      await page.click(`${ROOT} [data-action="checkin"]`);
      await page.waitForSelector(`${ROOT}.nfh-cw--in`);
      assert.doesNotMatch(await page.locator(`${ROOT} .nfh-cw-status`).innerText(), /Not checked in/);
    } finally {
      await close();
    }
  });

  for (const theme of THEMES) {
    it(`has settings that persist, and a test button (${theme})`, async () => {
      const { page, close } = await openFaction({ theme });
      try {
        await page.click(`${ROOT} [data-action="settings"]`);
        await page.selectOption(`${ROOT} [data-pref="alertMode"]`, "always");
        await page.fill(`${ROOT} [data-pref="alertSeconds"]`, "1:45");
        await page.locator(`${ROOT} [data-pref="alertSeconds"]`).blur();
        await page.check(`${ROOT} [data-pref="markWall"]`);
        assert.match(await page.locator(`${ROOT} .nfh-cw-chip`).innerText(), /Alert 1:45/);
        assert.equal(await page.evaluate(() => document.body.classList.contains("nfh-mark-wall")), true);
        const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("nfhChainWatch")));
        assert.equal(saved.alertMode, "always");
        assert.equal(saved.alertSeconds, 105);

        // Invalid times are rejected and the old value comes back.
        await page.fill(`${ROOT} [data-pref="alertSeconds"]`, "9:99");
        await page.locator(`${ROOT} [data-pref="alertSeconds"]`).blur();
        assert.equal(await page.inputValue(`${ROOT} [data-pref="alertSeconds"]`), "1:45");

        await screenshot(page.locator(ROOT), `chain-watch-settings-${theme}`);
        await page.click(`${ROOT} [data-action="test-alert"]`);
        await page.waitForSelector("#nfh-chain-flash", { state: "attached" });
      } finally {
        await close();
      }
    });
  }

  it("takes over the old Chain watcher script's settings", async () => {
    const { page, close } = await openFaction({
      localStorage: {
        chainWarcher: {
          watchChain: true, minuteAlert: 1, secundeAlert: 15, beepAlert: true, beepVolume: 0.3,
          color: "#0000ff", opacity: 0.5, interval: 500, markWallTargets: true,
        },
      },
      before: (p) => p.evaluate(() => {
        const old = document.createElement("div");
        old.id = "JoxDiv";
        document.body.appendChild(old);
      }),
    });
    try {
      assert.match(await page.locator(`${ROOT} .nfh-cw-chip`).innerText(), /Alert 1:15/);
      assert.equal(await page.locator(`${ROOT} .nfh-cw-chip.is-armed`).count(), 1);
      assert.equal(await page.evaluate(() => document.body.classList.contains("nfh-mark-wall")), true);
      await page.click(`${ROOT} [data-action="settings"]`);
      assert.equal(await page.inputValue(`${ROOT} [data-pref="pace"]`), "fast");
      assert.equal(await page.isChecked(`${ROOT} [data-pref="beep"]`), true);
      assert.match(await page.locator(`${ROOT} .nfh-cw-settings`).innerText(), /old "Chain watcher" script is still running/);
    } finally {
      await close();
    }
  });
});
