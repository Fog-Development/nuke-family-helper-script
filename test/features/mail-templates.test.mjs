import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// The mail template bar on Torn's compose page and the faction newsletter.
// Torn's own scripts don't run in the harness, so there is no TinyMCE: the
// bar writes the editor element itself, the fallback the real page never
// needs (the page bridge is only checked live).

const BAR = "#nfh-mail-templates";
const EDITOR = '[contenteditable="true"]';

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

function site({ helper = true } = {}) {
  const calls = { faction: 0 };
  const list = (page) => ({
    page,
    personal: [
      { id: 1, name: "Welcome", subject: "Hi {name}", scope: "messages", pinned: true, updated_at: "2026-11-12T00:00:00Z" },
      { id: 2, name: "Old note", subject: null, scope: "both", pinned: false, updated_at: "2026-11-12T00:00:00Z" },
    ],
    faction: helper ? [{ id: 7, name: "Revive payout", audience: "Every faction", pinned: true, edit_url: "https://nuke.family/faction/mail/templates/7/edit" }] : null,
    messages: helper
      ? [{ id: "uuid-1", subject: "Pay sent", status: "finished", author: "Someone", at: "2026-11-12T00:00:00Z", url: "https://nuke.family/faction/mail/messages/uuid-1" }]
      : null,
    links: { faction_mail: helper ? "https://nuke.family/faction/mail" : null },
  });
  return {
    calls,
    api: {
      "GET /mail-templates?page=messages": () => list("messages"),
      "GET /mail-templates?page=newsletter": () => list("newsletter"),
      "GET /mail-templates/personal/1": { id: 1, name: "Welcome", subject: "Hi {name}", body: "<p>Hello <strong>{name}</strong> [{id}], from {me}.</p>", scope: "messages" },
      "GET /mail-templates/faction/7": () => {
        calls.faction++;
        return { id: 7, name: "Revive payout", subject: "Revive pay", html: `<table><tbody><tr><td>Paid ${calls.faction}</td></tr></tbody></table>` };
      },
      "POST /mail-templates/personal": (details) => ({ id: 3, ...JSON.parse(details.data), pinned: false }),
    },
  };
}

async function openCompose(options = {}) {
  const session = await openTornPage(browser, { page: "messages-compose", step: 4, ...options });
  await session.page.waitForSelector(`${BAR} .nfh-mt-chip`);
  return session;
}

describe("mail template bar", () => {
  for (const theme of THEMES) {
    it(`sits above the compose form with pinned templates (${theme})`, async () => {
      const { page, errors, close } = await openCompose({ theme, api: site().api });
      try {
        const chips = await page.locator(`${BAR} .nfh-mt-chip`).allInnerTexts();
        assert.deepEqual(
          chips.map((text) => text.replace(/\s+/g, " ").trim()),
          ["Welcome", "FRevive payout"],
        );
        // Right above Torn's "Send a Message" box.
        assert.equal(await page.evaluate((bar) => document.querySelector(bar).nextElementSibling.querySelector("#editor-form") !== null, BAR), true);
        const { ratio } = await measureContrast(page, `${BAR} .nfh-mt-title`);
        assert.ok(ratio >= 4.5, `title contrast ${ratio.toFixed(2)} in ${theme}`);

        await page.click(`${BAR} [data-act="toggle-all"]`);
        await page.waitForSelector(`${BAR} .nfh-mt-all`);
        assert.match(
          await page.locator(`${BAR} .nfh-mt-all`).innerText(),
          /Your templates[\s\S]*Old note[\s\S]*Faction templates[\s\S]*Revive payout[\s\S]*Recent faction mail[\s\S]*Pay sent/,
        );
        await page.click(`${BAR} [data-act="help"]`);
        assert.match(await page.locator(`${BAR} .nfh-mt-help`).innerText(), /\{name\}[\s\S]*\{me\}/);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(BAR), `mail-templates-${theme}`);
      } finally {
        await close();
      }
    });
  }

  it("asks before replacing a written message, then fills placeholders from the page", async () => {
    const { page, apiCalls, close } = await openCompose({ api: site().api });
    try {
      const recipient = await page.inputValue('input[name="sendto"]');
      const [, name, id] = recipient.match(/^(.*?)\s*\[(\d+)\]$/);
      await page.click(`${BAR} .nfh-mt-chip--personal`);
      await page.waitForSelector(`${BAR} .nfh-mt-confirm`);
      assert.match(await page.locator(`${BAR} .nfh-mt-confirm`).innerText(), /Replace what is in the editor/);
      await page.click(`${BAR} [data-act="confirm-yes"]`);
      await page.waitForSelector(`${BAR} .nfh-mt-message--warn`);

      const html = await page.locator(`#editor-form ${EDITOR}`).innerHTML();
      assert.ok(html.includes(`Hello <strong>${name}</strong> [${id}]`), html);
      assert.equal(await page.inputValue('input[name="subject"]'), `Hi ${name}`);
      // No sidebar data in the capture's session storage: {me} can't be filled, and the bar says so.
      assert.match(await page.locator(`${BAR} .nfh-mt-message`).innerText(), /\{me\} left as is/);

      // The body is kept: using it again makes no second call.
      await page.click(`${BAR} .nfh-mt-chip--personal`);
      await page.click(`${BAR} [data-act="confirm-yes"]`);
      await page.waitForTimeout(200);
      assert.equal(apiCalls.filter((call) => call.path === "/mail-templates/personal/1").length, 1);
    } finally {
      await close();
    }
  });

  it("saves what is in the editor, with the subject, for this page by default", async () => {
    const { page, apiCalls, close } = await openCompose({ api: site().api });
    try {
      const editorHtml = await page.locator(`#editor-form ${EDITOR}`).innerHTML();
      await page.click(`${BAR} [data-act="save"]`);
      await page.fill(`${BAR} [data-field="name"]`, "Thanks");
      await page.keyboard.press("Enter");
      await page.waitForSelector(`${BAR} .nfh-mt-message--ok`);
      const saved = apiCalls.find((call) => call.method === "POST" && call.path === "/mail-templates/personal");
      const body = JSON.parse(saved.data);
      assert.deepEqual(
        { name: body.name, scope: body.scope, subject: body.subject, body: body.body },
        { name: "Thanks", scope: "messages", subject: await page.inputValue('input[name="subject"]'), body: editorHtml },
      );
    } finally {
      await close();
    }
  });

  it("renders faction templates fresh every time, on the newsletter too", async () => {
    const s = site();
    const { page, apiCalls, errors, close } = await openTornPage(browser, { page: "controls-newsletter", step: 4, api: s.api });
    try {
      await page.waitForSelector(`${BAR} .nfh-mt-chip--faction`);
      assert.equal(await page.evaluate((bar) => document.querySelector(bar).nextElementSibling.id, BAR), "react-root-faction-newsletter");
      assert.ok(apiCalls.some((call) => call.path === "/mail-templates?page=newsletter"));

      for (const n of [1, 2]) {
        await page.click(`${BAR} .nfh-mt-chip--faction`);
        await page.click(`${BAR} [data-act="confirm-yes"]`);
        await page.waitForFunction(
          (text) => document.querySelector('#react-root-faction-newsletter [contenteditable="true"]').innerText.includes(text),
          `Paid ${n}`,
        );
      }
      assert.equal(s.calls.faction, 2);
      assert.equal(await page.inputValue('#react-root-faction-newsletter input[class*="titleField"]'), "Revive pay");

      await page.click(`${BAR} [data-act="save"]`);
      assert.equal(await page.locator(`${BAR} [data-field="scope"]`).inputValue(), "newsletter");
      assert.deepEqual(errors, []);
    } finally {
      await close();
    }
  });

  it("members see only their own templates, and errors are explained", async () => {
    const api = { ...site({ helper: false }).api, "GET /mail-templates/personal/1": () => respond(404, { message: "Not found" }) };
    const { page, close } = await openCompose({ api });
    try {
      assert.equal(await page.locator(`${BAR} .nfh-mt-chip--faction`).count(), 0);
      await page.click(`${BAR} .nfh-mt-chip--personal`);
      await page.click(`${BAR} [data-act="confirm-yes"]`);
      await page.waitForSelector(`${BAR} .nfh-mt-message--error`);
      assert.match(await page.locator(`${BAR} .nfh-mt-message`).innerText(), /That template is gone/);
    } finally {
      await close();
    }
  });

  it("fits TornPDA's width", async () => {
    const { page, errors, close } = await openTornPage(browser, { page: "messages-compose-mobile", api: site().api });
    try {
      await page.waitForSelector(`${BAR} .nfh-mt-chip`);
      const overflow = await page.evaluate((bar) => document.querySelector(bar).scrollWidth - document.querySelector(bar).clientWidth, BAR);
      assert.ok(overflow <= 0, `bar overflows by ${overflow}px`);
      assert.deepEqual(errors, []);
      await screenshot(page.locator(BAR), "mail-templates-mobile");
    } finally {
      await close();
    }
  });
});
