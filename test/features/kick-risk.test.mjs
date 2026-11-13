import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, loadPageFixture, openTornPage, respond, screenshot } from "../harness/torn.js";
import { measureContrast, THEMES } from "../harness/theme.js";

// Kick risk on the faction controls Members list. The figures are made up;
// the member ids are read from the capture so no names are written here.

const BADGE = ".nfh-kr-badge";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

function memberIds(page, step) {
  const html = loadPageFixture(page, step);
  const start = html.indexOf('id="option-members-root"');
  const ids = [...html.slice(start).matchAll(/class="honorWrap[^"]*"[^>]*><a[^>]*href="\/profiles\.php\?XID=(\d+)"/g)].map((match) => Number(match[1]));
  return [...new Set(ids)];
}

function member(id, kick, extra = {}) {
  return {
    player_id: id,
    kick_risk: kick,
    kick_risk_note: "Departure risk: 12%",
    days_in_faction: 400,
    energy_change_pct: -40,
    stats: [
      { key: "avg_daily_energy_spend_7", label: "avgE7", value: 120, below_target: true, target: 150 },
      { key: "avg_daily_energy_spend_30", label: "avgE30", value: 200, below_target: false, target: null },
      { key: "average_daily_xanax_taken_30_days", label: "Xanax Daily", value: 1.2, below_target: false, target: null },
    ],
    missed: [{ key: "crimes_7", label: "crimes7", value: 4, below_target: true, target: 10 }],
    ...extra,
  };
}

function site(ids, overrides = {}) {
  const kicks = [5, 18, 30, 50];
  return {
    "GET /faction-monitor/members": {
      faction_id: 17133,
      monitor_url: "https://nuke.family/faction/17133",
      has_targets: true,
      members: ids.map((id, n) => member(id, kicks[n % kicks.length], overrides[id] || {})),
    },
    "POST /script/faction-blacklist": (details) => ({ id: 1, ...JSON.parse(details.data) }),
  };
}

describe("kick risk on the Members list", () => {
  for (const theme of THEMES) {
    it(`badges members by the monitor's tiers and opens a panel (${theme})`, async () => {
      const ids = memberIds("controls-members", 0);
      assert.ok(ids.length >= 4, "the capture lists members");
      const { page, errors, close } = await openTornPage(browser, { page: "controls-members", theme, api: site(ids) });
      try {
        await page.waitForSelector(BADGE);
        for (const tier of ["low", "elevated", "moderate", "high"]) assert.ok((await page.locator(`${BADGE}--${tier}`).count()) > 0, `${tier} badge`);
        assert.equal(await page.locator(`${BADGE}--high`).first().innerText(), "Kick 50%");
        assert.equal(await page.locator(`${BADGE}--elevated`).first().innerText(), "18%");
        assert.equal(await page.locator(`${BADGE}--low`).first().innerText(), "");

        await page.locator(`${BADGE}--high`).first().click();
        await page.waitForSelector(".nfh-kr-detail");
        const text = await page.locator(".nfh-kr-detail").innerText();
        assert.match(text, /Kick risk 50%/);
        assert.match(text, /avgE7 120 ↓ 40% target 150/);
        assert.match(text, /avgE30 200/);
        assert.match(text, /Xanax Daily 1\.2/);
        assert.match(text, /Below target:\s+crimes7 4 target 10/);
        assert.equal(await page.locator('.nfh-kr-detail a[href="https://nuke.family/faction/17133"]').count(), 1);
        const { ratio } = await measureContrast(page, `${BADGE}--high`);
        assert.ok(ratio >= 4.5, `badge contrast ${ratio.toFixed(2)} in ${theme}`);
        assert.deepEqual(errors, []);
        await screenshot(page.locator(".nfh-kr-detail").locator(".."), `kick-risk-detail-${theme}`);

        await page.click('.nfh-kr-detail [data-kr="close"]');
        await page.waitForSelector(".nfh-kr-detail", { state: "detached" });
      } finally {
        await close();
      }
    });
  }

  it("suggests a kick reason and fills it in on a click, then offers the blacklist once they are gone", async () => {
    const ids = memberIds("controls-members-kick", 3);
    const { page, apiCalls, close } = await openTornPage(browser, { page: "controls-members-kick", step: 3, api: site(ids) });
    try {
      await page.waitForSelector(".nfh-kr-kick");
      assert.match(await page.locator(".nfh-kr-kick").innerText(), /Suggested reason: Failing to meet faction standards - avgE7\(120\), avgE30\(200\), xanDaily\(1\.2\), crimes7\(4\)/);
      await page.click('.nfh-kr-kick [data-kr="fill"]');
      const input = page.locator('[class*="confirm___"] input[class*="reasonInput___"]');
      assert.equal(await input.inputValue(), "Failing to meet faction standards - avgE7(120), avgE30(200), xanDaily(1.2), crimes7(4)");
      await screenshot(page.locator('[class*="confirm___"]'), "kick-risk-reason");

      // Torn's Yes, then the row going away, as a kick would.
      const kickedId = await page.evaluate(() => {
        const row = document.querySelector('[class*="confirm___"]').closest('[class*="rowWrapper___"]');
        return Number(new URL(row.querySelector('[class*="member___"] a[href*="XID="]').href).searchParams.get("XID"));
      });
      await page.locator('[class*="confirm___"] button', { hasText: "Yes" }).click();
      await page.evaluate(() => document.querySelector('[class*="confirm___"]').closest('[class*="rowWrapper___"]').remove());
      await page.waitForSelector("#nfh-kr-blacklist textarea");
      assert.equal(await page.locator("#nfh-kr-blacklist textarea").inputValue(), "Failing to meet faction standards - avgE7(120), avgE30(200), xanDaily(1.2), crimes7(4)");
      await page.fill("#nfh-kr-blacklist textarea", "Inactive for weeks");
      await page.click('#nfh-kr-blacklist [data-kr="blacklist"]');
      await page.waitForSelector("#nfh-kr-blacklist .nfh-cw-ok");
      const posted = JSON.parse(apiCalls.find((call) => call.path === "/script/faction-blacklist").data);
      assert.deepEqual(posted, { player_id: kickedId, reason: "Inactive for weeks" });
    } finally {
      await close();
    }
  });

  it("points a member still in an OC to their crime, and back again", async () => {
    const ids = memberIds("controls-members-kick", 1);
    const { page, close } = await openTornPage(browser, { page: "controls-members-kick", step: 1, api: site(ids) });
    try {
      await page.waitForSelector('.nfh-kr-kick [data-kr="to-crimes"]');
      assert.match(await page.locator(".nfh-kr-kick").innerText(), /In an organized crime/);
      assert.equal(await page.locator('.nfh-kr-kick [data-kr="fill"]').count(), 0);
      await page.click('.nfh-kr-kick [data-kr="to-crimes"]');
      await page.waitForSelector("#nfh-kr-return");
      assert.match(await page.locator("#nfh-kr-return").innerText(), /remove them from their crime first/);
      await page.click('#nfh-kr-return [data-kr="back"]');
      await page.waitForSelector("#nfh-kr-return", { state: "detached" });
      assert.match(page.url(), /option=members/);
    } finally {
      await close();
    }
  });

  it("on the crimes page, names the member's crime and finds their slot", async () => {
    const html = loadPageFixture("factions-crimes-planning", 0);
    const id = Number(html.slice(html.indexOf('id="faction-crimes-root"')).match(/profiles\.php\?XID=(\d+)/)[1]);
    const api = { "GET /oc/board": { data: { synced_at: 0, crimes: [{ id: 9, name: "Break the Bank", status: "Planning", slots: [{ role: "Muscle #2", player_id: id }] }] } } };
    const before = (page) => page.evaluate((target) => sessionStorage.setItem("nfhKickReturn", JSON.stringify(target)), { id, name: "Someone" });
    const { page, errors, close } = await openTornPage(browser, { page: "factions-crimes-planning", api, before });
    try {
      await page.waitForFunction(() => /Break the Bank/.test(document.getElementById("nfh-kr-return")?.innerText || ""));
      assert.match(await page.locator("#nfh-kr-return").innerText(), /They're in Break the Bank \(Planning\) as Muscle #2\./);
      await page.click('#nfh-kr-return [data-kr="find"]');
      const slot = page.locator(".nfh-kr-slot");
      assert.equal(await slot.count(), 1);
      assert.equal(await slot.locator(`a[href*="XID=${id}"]`).count() >= 1, true, "the highlighted slot is theirs");
      assert.equal(await slot.locator('[class^="slotHeader___"]').count(), 1, "one slot, not the whole crime");
      assert.deepEqual(errors, []);
      await screenshot(page.locator("#nfh-kr-return"), "kick-risk-return");
    } finally {
      await close();
    }
  });

  it("asks nothing more of a member without access for half a day", async () => {
    const { page, apiCalls, close } = await openTornPage(browser, {
      page: "controls-members",
      api: { "GET /faction-monitor/members": () => respond(403, { error: "no" }) },
    });
    try {
      await page.waitForTimeout(1200);
      assert.equal(await page.locator(BADGE).count(), 0);
      assert.equal(apiCalls.filter((call) => call.path === "/faction-monitor/members").length, 1);
      assert.ok(await page.evaluate(() => Number(localStorage.getItem("nfhKickRiskDenied")) > 0));
    } finally {
      await close();
    }
  });
});
