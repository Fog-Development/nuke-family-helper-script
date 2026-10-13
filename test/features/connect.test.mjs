import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

const BANNER = "#nfh-connect-banner";
const CONNECT_URL = "https://nuke.family/script/connect?code=abc123";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

// window.open would load the real nuke.family in a second tab: hand back a
// stand-in and note where the script points it. Dialogs are recorded and a
// prompt answers with `typed`.
const stubWindow =
  (typed = null) =>
  (page) =>
    page.evaluate((answer) => {
      window.__opened = [];
      window.__alerts = [];
      window.open = () => {
        const tab = { location: {}, closed: false, close: () => (tab.closed = true) };
        window.__opened.push(tab);
        return tab;
      };
      window.alert = (message) => window.__alerts.push(message);
      window.prompt = () => answer;
    }, typed);

const begun = respond(201, { secret: "s3cret", url: CONNECT_URL, expires_in: 900 });
const pendingReply = respond(202, { status: "pending" });
const connectedReply = { status: "connected", token: "t".repeat(50), player: { id: 1, name: "Fogest" } };

describe("connecting to nuke.family", () => {
  it("shows nothing to a member whose key works", async () => {
    const { page, dialogs, close } = await openTornPage(browser, { page: "profiles" });
    try {
      await page.waitForSelector(".nfh-shitlist-profile");
      await page.waitForTimeout(1200);
      assert.equal(await page.locator(BANNER).count(), 0);
      assert.equal(await page.locator(".nfh-connect-note").count(), 0);
      assert.deepEqual(dialogs, []);
    } finally {
      await close();
    }
  });

  for (const theme of THEMES) {
    it(`tells a member with no key, in a bar and where features would be, without a dialog (${theme})`, async () => {
      const { page, dialogs, errors, close } = await openTornPage(browser, { page: "profiles", theme, gmValues: {} });
      try {
        await page.waitForSelector(BANNER);
        const text = await page.locator(BANNER).innerText();
        assert.match(text, /Nuke Family Helper is not connected to nuke\.family/);
        assert.equal(await page.locator(`${BANNER} [data-nfh-connect]`).textContent(), "Connect");
        assert.equal(await page.locator(`${BANNER} [data-nfh-connect-manual]`).count(), 1);

        await page.waitForSelector(".nfh-shitlist-profile .nfh-connect-note");
        assert.match(await page.locator(".nfh-connect-note").innerText(), /not connected to nuke\.family/);

        // The old confirm/prompt on every page load is gone.
        assert.deepEqual(dialogs, []);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(BANNER), `connect-banner-${theme}`);
        await screenshot(page.locator(".nfh-shitlist-profile"), `connect-note-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("connects: sends the member to approve, waits, then keeps the key it is handed", async () => {
    let polls = 0;
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "profiles",
      gmValues: {},
      before: stubWindow(),
      api: {
        "POST /script/connect": begun,
        "POST /script/connect/token": () => (++polls < 2 ? pendingReply : connectedReply),
      },
    });
    try {
      await page.locator(`${BANNER} [data-nfh-connect]`).click();
      await page.waitForSelector(`${BANNER} [data-nfh-connect-open]`);

      // The tab opened inside the click now points at nuke.family, and the
      // banner offers the same address in case it was blocked.
      assert.deepEqual(await page.evaluate(() => window.__opened.map((tab) => tab.location.href)), [CONNECT_URL]);
      assert.equal(await page.locator(`${BANNER} [data-nfh-connect-open]`).getAttribute("href"), CONNECT_URL);
      assert.match(await page.locator(BANNER).innerText(), /Finish connecting on nuke\.family/);
      await screenshot(page.locator(BANNER), "connect-banner-waiting");

      const start = apiCalls.find((call) => call.path === "/script/connect");
      assert.deepEqual(JSON.parse(start.data), { client: "browser", player_id: 1 });
      // The secret stays here; it is never part of the address the member opens.
      assert.ok(!CONNECT_URL.includes("s3cret"));

      // Checked in one go: the page reloads a moment after this.
      await page.waitForFunction(
        () =>
          /connected as Fogest/.test(document.querySelector("#nfh-connect-banner")?.innerText || "") &&
          window.__gmStore.apiToken === "t".repeat(50) &&
          window.__gmStore.nfhConnectPending === null,
        null,
        { timeout: 15000 },
      );
      const sent = apiCalls.filter((call) => call.path === "/script/connect/token");
      assert.ok(sent.length >= 2);
      assert.deepEqual(JSON.parse(sent[0].data), { secret: "s3cret" });
    } finally {
      await close();
    }
  });

  it("picks a connection back up on the next page load (TornPDA comes back to a fresh page)", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "profiles",
      gmValues: { nfhConnectPending: { secret: "s3cret", url: CONNECT_URL, expires: Date.now() + 600000 } },
      api: { "POST /script/connect/token": connectedReply },
    });
    try {
      await page.waitForFunction(() => window.__gmStore.apiToken === "t".repeat(50), null, { timeout: 15000 });
    } finally {
      await close();
    }
  });

  it("says so when the attempt ran out, and lets the member try again", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "profiles",
      gmValues: {},
      before: stubWindow(),
      api: {
        "POST /script/connect": begun,
        "POST /script/connect/token": respond(410, { status: "expired", error: "That connection ran out of time. Start again." }),
      },
    });
    try {
      await page.locator(`${BANNER} [data-nfh-connect]`).click();
      await page.waitForFunction(() => /ran out of time/.test(document.querySelector("#nfh-connect-banner").innerText), null, {
        timeout: 15000,
      });
      assert.equal(await page.locator(`${BANNER} [data-nfh-connect]`).count(), 1);
      assert.equal(await page.evaluate(() => window.__gmStore.apiToken), undefined);
    } finally {
      await close();
    }
  });

  it("closes the tab it opened and says so when nuke.family cannot be reached to start", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "profiles",
      gmValues: {},
      before: stubWindow(),
      api: { "POST /script/connect": respond(429, { message: "Too Many Attempts." }) },
    });
    try {
      await page.locator(`${BANNER} [data-nfh-connect]`).click();
      await page.waitForFunction(() => /Too many attempts from here/.test(document.querySelector("#nfh-connect-banner").innerText));
      assert.deepEqual(await page.evaluate(() => window.__opened.map((tab) => tab.closed)), [true]);
    } finally {
      await close();
    }
  });

  it("says the script was disconnected when nuke.family refuses the stored key", async () => {
    const { page, dialogs, close } = await openTornPage(browser, {
      page: "profiles",
      api: { "GET /cache/last-updates": respond(401, { message: "Unauthenticated." }) },
    });
    try {
      await page.waitForSelector(BANNER);
      assert.match(await page.locator(BANNER).innerText(), /has been disconnected/);
      assert.equal(await page.locator(`${BANNER} [data-nfh-connect]`).textContent(), "Reconnect");
      await page.waitForSelector(".nfh-connect-note");
      assert.deepEqual(dialogs, []);
      await screenshot(page.locator(BANNER), "connect-banner-rejected");
    } finally {
      await close();
    }
  });

  it("says it cannot reach nuke.family when nothing gets an answer, without offering to connect", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "profiles",
      before: (page) =>
        page.evaluate(() => {
          window.GM_xmlhttpRequest = (details) => details.onerror(new Error("offline"));
        }),
    });
    try {
      await page.waitForSelector(BANNER);
      assert.match(await page.locator(BANNER).innerText(), /cannot reach nuke\.family right now/);
      assert.equal(await page.locator(`${BANNER} [data-nfh-connect]`).count(), 0);
    } finally {
      await close();
    }
  });

  it("can be hidden for the day", async () => {
    const { page, close } = await openTornPage(browser, { page: "profiles", gmValues: {} });
    try {
      await page.locator(`${BANNER} [data-nfh-connect-dismiss]`).click();
      assert.equal(await page.locator(BANNER).count(), 0);
      assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem("nfhConnectBannerHidden"))).state, "missing");
      // Where a feature would be still says why it is empty.
      assert.equal(await page.locator(".nfh-connect-note").count(), 1);
    } finally {
      await close();
    }
  });
});

describe("typing a key in by hand", () => {
  const open = (typed, api = {}) =>
    openTornPage(browser, { page: "profiles", gmValues: {}, before: stubWindow(typed), api });

  it("turns away a Torn API key and points at Connect", async () => {
    const { page, apiCalls, close } = await open("AbCdEfGhIjKlMnOp");
    try {
      await page.locator(`${BANNER} [data-nfh-connect-manual]`).click();
      await page.waitForFunction(() => window.__alerts.length > 0);
      assert.match(await page.evaluate(() => window.__alerts[0]), /looks like a Torn API key/);
      assert.equal(await page.evaluate(() => window.__gmStore.apiToken), undefined);
      assert.equal(apiCalls.filter((call) => call.path === "/user/get-own-roles").length, 0);
    } finally {
      await close();
    }
  });

  it("does not keep a key nuke.family refuses", async () => {
    const { page, close } = await open("w".repeat(50), {
      "GET /user/get-own-roles": respond(401, { message: "Unauthenticated." }),
    });
    try {
      await page.locator(`${BANNER} [data-nfh-connect-manual]`).click();
      await page.waitForFunction(() => window.__alerts.length > 0);
      assert.match(await page.evaluate(() => window.__alerts[0]), /did not accept that key/);
      assert.equal(await page.evaluate(() => window.__gmStore.apiToken), undefined);
      // Trying a key is not the stored key being refused.
      assert.match(await page.locator(BANNER).innerText(), /is not connected/);
    } finally {
      await close();
    }
  });

  it("keeps one nuke.family accepts, from the faction controls button too", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-controls",
      before: stubWindow(`  ${"g".repeat(50)}  `),
    });
    try {
      await page.locator("#nfh-change-key-btn").click();
      await page.waitForFunction(() => window.__gmStore.apiToken === "g".repeat(50));
      assert.match(await page.evaluate(() => window.__alerts[0]), /Nuke Family key saved/);
    } finally {
      await close();
    }
  });
});
