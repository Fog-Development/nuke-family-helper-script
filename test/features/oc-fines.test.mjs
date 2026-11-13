import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { fixtureUrl, launch, openTornPage, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

// OC fines: the profile box for staff who may give fines, and the mail bar's
// recent fines on Torn's compose page. The site is stubbed; its answers are
// made up here (no fixture content in assertions).

const BOX = ".nfh-ocf-box";
const BAR = "#nfh-mail-templates";

let browser;
let profileId;
before(async () => {
  browser = await launch();
  // The viewed player's id, for the context route the box calls.
  profileId = new URL(fixtureUrl("profiles")).searchParams.get("XID");
});
after(async () => {
  await browser.close();
});

// The capture's profile shows no faction where Torn usually does; give it one,
// as a faction member's profile has. Torn draws the profile's info after the
// page loads, so the link arrives a moment later. 5678 is the viewer's own
// faction in the default OC config.
const inFaction = (factionId = 5678) => async (page) => {
  await page.evaluate((id) => {
    setTimeout(() => {
      const info = document.createElement("div");
      info.className = "basic-information";
      info.innerHTML = `<ul class="info-table"><li><a href="/factions.php?step=profile&ID=${id}">Test Faction</a></li></ul>`;
      info.hidden = true;
      document.body.appendChild(info);
    }, 600);
  }, factionId);
};

function context() {
  return {
    data: {
      faction: { id: 1, name: "Test Faction" },
      player: { id: Number(profileId), name: "Bob", in_faction: true },
      can_manage: false,
      currency: "points",
      reasons: [
        { key: "delay_travel", label: "Delaying OC: travel", description: "", crime: "expected", note_required: false, default_crime_id: 501, quote: { summary: "Strike 2 on the shared ladder: 10 points, expires 8 Dec 2026" } },
        { key: "idle_after_oc", label: "Idle after previous OC", description: "", crime: "never", note_required: false, default_crime_id: null, quote: { summary: "Strike 2 on the shared ladder: 10 points" } },
      ],
      crimes: [{ crime_id: 501, label: "Current · Stage Fright L5 · Lookout · ready 2h ago" }],
      record: [{ id: 3, reason_label: "Idle after previous OC", penalty: "Warning", status_label: "Warning", issued_at: 1794500000 }],
    },
  };
}

describe("OC fines on a profile", () => {
  for (const theme of THEMES) {
    it(`staff who may fine get a box that issues a fine for the waiting crime (${theme})`, async () => {
      const issued = [];
      const { page, errors, close } = await openTornPage(browser, {
        page: "profiles",
        theme,
        before: inFaction(),
        api: {
          "GET /user/get-own-permissions": { permissions: ["oc_fine.issue"] },
          [`GET /oc-fines/context?player_id=${profileId}`]: context(),
          "POST /oc-fines": (details) => {
            issued.push(JSON.parse(details.data));
            return {
              data: { id: 12, kind: "fine", player_id: Number(profileId), reason_label: "Delaying OC: travel", penalty: "10 points", strike: 2, url: "https://nuke.family/faction/organized-crimes/fines/12" },
            };
          },
        },
      });
      try {
        await page.waitForSelector(`${BOX} .nfh-ocf-open`);
        await page.click(`${BOX} .nfh-ocf-open`);
        await page.waitForSelector(`${BOX} [data-ocf="reason"]`);
        await page.selectOption(`${BOX} [data-ocf="reason"]`, "delay_travel");
        assert.equal(await page.inputValue(`${BOX} [data-ocf="crime"]`), "501", "the waiting crime is picked");
        assert.match(await page.locator(`${BOX} .nfh-ocf-quote`).innerText(), /Strike 2/);
        await screenshot(page.locator(BOX), `oc-fines-profile-${theme}`);

        await page.selectOption(`${BOX} [data-ocf="reason"]`, "idle_after_oc");
        assert.equal(await page.locator(`${BOX} [data-ocf="crime"]`).count(), 0, "idle names no crime");
        await page.selectOption(`${BOX} [data-ocf="reason"]`, "delay_travel");
        await page.click(`${BOX} [data-ocf-act="issue"]`);
        await page.waitForSelector(`${BOX} .nfh-ocf-done`);

        assert.deepEqual(
          { reason: issued[0].reason, crime: issued[0].crime_id, via: issued[0].via },
          { reason: "delay_travel", crime: 501, via: "script" },
        );
        assert.match(await page.locator(`${BOX} .nfh-ocf-done`).innerText(), /Fine #12[\s\S]*10 points/);
        assert.deepEqual(errors, []);
      } finally {
        await close();
      }
    });
  }

  it("shows nothing on the profile of someone in another faction", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "profiles",
      before: inFaction(9999),
      api: { "GET /user/get-own-permissions": { permissions: ["oc_fine.issue"] } },
    });
    try {
      await page.waitForSelector(".basic-information a", { state: "attached" });
      await page.waitForTimeout(800);
      assert.equal(await page.locator(BOX).count(), 0);
      assert.equal(apiCalls.some((call) => call.path.startsWith("/oc-fines")), false);
    } finally {
      await close();
    }
  });

  it("shows nothing to members who can't give fines", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "profiles",
      before: inFaction(),
      api: { "GET /user/get-own-permissions": { permissions: [] } },
    });
    try {
      await page.waitForTimeout(800);
      assert.equal(await page.locator(BOX).count(), 0);
      assert.equal(apiCalls.some((call) => call.path.startsWith("/oc-fines")), false);
    } finally {
      await close();
    }
  });
});

describe("recent fines in the mail bar", () => {
  it("puts a fine's mail in the editor and marks it mailed when asked", async () => {
    const marked = [];
    const { page, close } = await openTornPage(browser, {
      page: "messages-compose",
      step: 4,
      api: {
        "GET /mail-templates?page=messages": {
          page: "messages",
          personal: [],
          faction: null,
          messages: null,
          fines: [{ id: 12, player_id: 42, player_name: "Bob", reason: "Delaying OC: travel", penalty: "10 points", issued_at: 1794500000 }],
          links: {},
        },
        "GET /oc-fines/12/mail": {
          data: { subject: "OC fine: Delaying OC: travel", html: "<p>Your fine is <b>10 points</b>.</p>", fine: { id: 12, player_id: 42, player_name: "Bob" } },
        },
        "POST /oc-fines/12/mailed": (details) => {
          marked.push(JSON.parse(details.data));
          return { data: { id: 12, mailed: true } };
        },
      },
    });
    try {
      await page.waitForSelector(`${BAR} .nfh-mt-chip--fine`);
      assert.match(await page.locator(`${BAR} .nfh-mt-fines`).innerText(), /Bob · 10 points · Delaying OC: travel/);
      await page.click(`${BAR} .nfh-mt-chip--fine`);
      const replace = page.locator(`${BAR} [data-act="confirm-yes"]`);
      if (await replace.count()) await replace.click();
      await page.waitForSelector(`${BAR} [data-act="fine-mailed"]`);
      assert.match(await page.locator('[contenteditable="true"]').first().innerHTML(), /10 points/);
      assert.equal(await page.inputValue('input[name="sendto"]'), "Bob [42]");
      assert.equal(await page.inputValue('#editor-form input[name="subject"]'), "OC fine: Delaying OC: travel");

      await page.click(`${BAR} [data-act="fine-mailed"]`);
      await page.waitForFunction(() => document.querySelector("#nfh-mail-templates").innerText.includes("marked as mailed"));
      assert.equal(marked.length, 1);
      await screenshot(page.locator(BAR), "oc-fines-mail-bar");
    } finally {
      await close();
    }
  });

  it("shows a fine given elsewhere without waiting for the kept list to run out", async () => {
    const list = (fines) => ({ page: "messages", personal: [], faction: null, messages: null, fines, links: {} });
    const { page, close } = await openTornPage(browser, {
      page: "messages-compose",
      step: 4,
      // A list kept a minute ago, before the fine was given in Discord.
      localStorage: { nfhMailTemplateList: { messages: { at: Date.now() - 60 * 1000, data: list([]) } } },
      api: {
        "GET /mail-templates?page=messages": list([{ id: 13, player_id: 42, player_name: "Bob", reason: "Other", penalty: "Warning", issued_at: 1794500000 }]),
      },
    });
    try {
      await page.waitForSelector(`${BAR} .nfh-mt-chip--fine`);
      assert.match(await page.locator(`${BAR} .nfh-mt-fines`).innerText(), /Bob · Warning · Other/);
    } finally {
      await close();
    }
  });
});
