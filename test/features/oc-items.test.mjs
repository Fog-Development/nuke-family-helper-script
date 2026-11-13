import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// Required OC items on the crimes and armoury pages. The members are made up
// (ids 111 and 222); the armoury rows are the capture's own.

const PANEL = "#nfh-oc-items";
const ATM_KEY = 1379;
const ANGLE_GRINDER = 1509;

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

const missing = [
  { crime_id: 1, crime: "Clinical Precision", status: "Planning", position: "Cat Burglar", player_id: 111, player_name: "Alice", item_id: ATM_KEY, item_name: "ATM Key", reusable: true, tab: "utilities" },
  { crime_id: 2, crime: "Break the Bank", status: "Recruiting", position: "Thief #1", player_id: 222, player_name: "Bob", item_id: ANGLE_GRINDER, item_name: "Angle Grinder", reusable: true, tab: "utilities" },
  { crime_id: 3, crime: "Smoke and Wing Mirrors", status: "Planning", position: "Hustler", player_id: 333, player_name: "Cyd", item_id: 222, item_name: "Flash Grenade", reusable: false, tab: "temporary" },
];

function items({ staff = true, mine = [], enabled = true } = {}) {
  if (!enabled) return { "GET /oc/items": { data: { enabled: false } } };
  return {
    "GET /oc/items": {
      data: {
        enabled: true,
        faction_id: 5678,
        mine,
        staff: staff
          ? {
              missing,
              // Nobody in a crime needs an Angle Grinder they hold, so every loaned one is to be retrieved.
              needs: { 111: [ATM_KEY], 222: [ANGLE_GRINDER], 333: [222] },
              oc_item_ids: [ATM_KEY, ANGLE_GRINDER, 222, 70],
              loans: [{ item_id: 70, item_name: "Polymorphic Virus", tab: "temporary", player_id: 444, player_name: "Dee" }],
              loans_at: 1794500000,
              loans_error: null,
            }
          : null,
      },
    },
  };
}

const withToken = async (page) => {
  await page.context().addCookies([{ name: "rfc_v", value: "token123", url: "https://www.torn.com" }]);
};

describe("OC items on the armoury", () => {
  for (const theme of THEMES) {
    it(`lists missing items and unused loans, and marks the open tab's rows (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, { page: "armoury-tabs", step: 11, theme, api: items() });
      try {
        await page.waitForSelector(`${PANEL} .nfh-oci-row`);
        const text = await page.locator(PANEL).innerText();
        assert.match(text, /3 missing · \d+ to retrieve/);
        assert.match(text, /Alice\s+ATM Key/);
        // On the utilities tab: Alice's ATM Key can be loaned from here, Cyd's grenade is on another tab.
        assert.equal(await page.locator(`${PANEL} [data-act="loan"]`).first().innerText(), "Loan to Alice");
        assert.equal(await page.locator(`${PANEL} a[href="#/tab=armoury&start=0&sub=temporary"]`).count() >= 1, true);
        // Every tab in this capture has been opened, so loans are read live from the page, not the site's list.
        assert.match(text, /Angle Grinder\s+not in a crime/);
        assert.doesNotMatch(text, /Dee/);

        const need = page.locator(`[id="tab=armoury&sub=utilities"] li.nfh-oci-row--need`);
        assert.ok((await need.count()) >= 1, "a free ATM Key is marked Need");
        assert.match(await need.first().locator(".nfh-oci-badge").getAttribute("title"), /Needed by Alice \(Cat Burglar, Clinical Precision\)/);
        assert.ok((await page.locator(`[id="tab=armoury&sub=utilities"] li.nfh-oci-row--retrieve`).count()) >= 1, "a loaned Angle Grinder is marked Retrieve");

        const { ratio } = await measureContrast(page, `${PANEL} .nfh-cw-toggle`);
        assert.ok(ratio >= 4.5, `contrast ${ratio.toFixed(2)} in ${theme}`);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(PANEL), `oc-items-armoury-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("uses the site's loan list for tabs not opened yet, and says how old it is", async () => {
    const { page, close } = await openTornPage(browser, { page: "armoury-tabs", step: 1, api: items() });
    try {
      await page.waitForSelector(`${PANEL} .nfh-oci-row`);
      const text = await page.locator(PANEL).innerText();
      assert.match(text, /Dee\s+Polymorphic Virus\s+not in a crime/);
      assert.match(text, /Loans from Torn's armoury list at \d\d:\d\d TCT/);
      // Not on the item's tab: a link there instead of a Loan button.
      assert.equal(await page.locator(`${PANEL} [data-act="loan"]`).count(), 0);
      assert.ok((await page.locator(`${PANEL} a[href="#/tab=armoury&start=0&sub=utilities"]`).count()) >= 2);
    } finally {
      await close();
    }
  });

  it("loans with one request to Torn per click, then counts it as done", async () => {
    const { page, close } = await openTornPage(browser, { page: "armoury-tabs", step: 11, api: items(), before: withToken });
    try {
      const sent = [];
      await page.route("**/factions.php?rfcv=*", (route) => {
        sent.push({ url: route.request().url(), body: route.request().postData() });
        route.fulfill({ contentType: "application/json", body: JSON.stringify({ success: true, message: "You loaned <b>ATM Key</b> to Alice." }) });
      });
      await page.waitForSelector(`${PANEL} [data-act="loan"]`);
      await page.click(`${PANEL} [data-act="loan"]`);
      await page.waitForSelector(`${PANEL} .nfh-oci-message--ok`);
      assert.equal(sent.length, 1);
      assert.match(sent[0].url, /\/factions\.php\?rfcv=token123$/);
      const fields = Object.fromEntries(new URLSearchParams(sent[0].body));
      assert.deepEqual(
        { step: fields.step, role: fields.role, itemID: fields.itemID, type: fields.type, user: fields.user, quantity: fields.quantity },
        { step: "armouryActionItem", role: "loan", itemID: String(ATM_KEY), type: "Tool", user: "Alice [111]", quantity: "1" },
      );
      assert.ok(await page.evaluate((id) => document.querySelector(`[id="tab=armoury&sub=utilities"] .img-wrap[data-armoryid="${id}"]`) !== null, fields.item), "a real armoury row's copy");
      assert.match(await page.locator(PANEL).innerText(), /You loaned ATM Key to Alice\./);
      assert.doesNotMatch(await page.locator(PANEL).innerText(), /Loan to Alice/);
      assert.match(await page.locator(PANEL).innerText(), /2 missing/);
    } finally {
      await close();
    }
  });

  it("says what Torn answered when a loan fails", async () => {
    const { page, close } = await openTornPage(browser, { page: "armoury-tabs", step: 11, api: items(), before: withToken });
    try {
      await page.route("**/factions.php?rfcv=*", (route) => route.fulfill({ contentType: "application/json", body: '{"success":false,"message":"You cannot loan this."}' }));
      await page.waitForSelector(`${PANEL} [data-act="loan"]`);
      await page.click(`${PANEL} [data-act="loan"]`);
      await page.waitForSelector(`${PANEL} .nfh-oci-message--error`);
      assert.match(await page.locator(PANEL).innerText(), /Torn did not loan it: You cannot loan this\./);
    } finally {
      await close();
    }
  });

  it("offers the members who need an item as fill-ins in Torn's Loan box", async () => {
    const { page, errors, close } = await openTornPage(browser, { page: "armoury-item-panel", step: 1, api: items() });
    try {
      await page.waitForSelector(".nfh-oci-fill [data-fill]");
      const box = page.locator("li.item-loan-act .loan-cont");
      assert.equal(await box.locator(".nfh-oci-fill [data-fill]").innerText(), "Bob");
      await box.locator(".nfh-oci-fill [data-fill]").click();
      assert.equal(await box.locator('input[name="user"]').inputValue(), "Bob [222]");
      assert.deepEqual(errors, []);
      await screenshot(page.locator("li.item-loan-act"), "oc-items-loan-fill");
    } finally {
      await close();
    }
  });

  it("draws nothing when the faction switched it off", async () => {
    const { page, close } = await openTornPage(browser, { page: "armoury-tabs", step: 11, api: items({ enabled: false }) });
    try {
      await page.waitForTimeout(800);
      assert.equal(await page.locator(`${PANEL} .nfh-oci-row`).count(), 0);
      assert.equal(await page.locator(".nfh-oci-badge").count(), 0);
    } finally {
      await close();
    }
  });
});

describe("OC items on the crimes page", () => {
  it("tells a member their slot is missing its item, and nothing else", async () => {
    const mine = [{ ...missing[0], player_id: 1 }];
    const { page, errors, close } = await openTornPage(browser, { page: "factions-crimes-planning", api: items({ staff: false, mine }) });
    try {
      await page.waitForSelector(`${PANEL} .nfh-oci-mine`);
      const text = await page.locator(PANEL).innerText();
      assert.match(text, /Your slot needs ATM Key, which you don't have/);
      assert.match(text, /Utilities armoury ›/);
      assert.doesNotMatch(text, /Missing items/);
      assert.equal(await page.evaluate((panel) => document.querySelector(panel).nextElementSibling?.id ?? document.querySelector(panel).nextElementSibling?.className, PANEL) !== null, true);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(PANEL), "oc-items-crimes-member");
    } finally {
      await close();
    }
  });

  it("shows staff every missing item with a link to its tab", async () => {
    const { page, close } = await openTornPage(browser, { page: "factions-crimes-planning", api: items() });
    try {
      await page.waitForSelector(`${PANEL} .nfh-oci-row`);
      assert.equal(await page.locator(`${PANEL} .nfh-oci-row`).count(), 3);
      assert.equal(await page.locator(`${PANEL} [data-act="loan"]`).count(), 0, "no loans from the crimes page");
      assert.doesNotMatch(await page.locator(PANEL).innerText(), /Loaned, not needed/);
    } finally {
      await close();
    }
  });

  it("stays away when there is nothing for a member", async () => {
    const { page, close } = await openTornPage(browser, { page: "factions-crimes-planning", api: items({ staff: false }) });
    try {
      await page.waitForTimeout(800);
      assert.equal(await page.locator(`${PANEL}:visible`).count(), 0);
    } finally {
      await close();
    }
  });
});
