import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { launch, openTornPage, respond, screenshot } from "../harness/torn.js";
import { THEMES } from "../harness/theme.js";

let browser;
before(async () => {
  browser = await launch();
});
after(async () => {
  await browser.close();
});

describe("faction controls buttons", () => {
  for (const theme of THEMES) {
    it(`are injected once on the controls tab (${theme})`, async () => {
      const { page, errors, close } = await openTornPage(browser, {
        page: "factions-controls",
        theme,
      });
      try {
        await page.waitForSelector("#nfh-change-key-btn");
        assert.equal(await page.locator("#nfh-change-key-btn").count(), 1);
        assert.equal(await page.locator("#nfh-check-updates-btn").count(), 1);
        assert.equal(await page.locator("#nfh-debug-info-btn").count(), 1);
        assert.deepEqual(errors, []);
        await screenshot(
          page.locator("#nfh-change-key-btn").locator(".."),
          `faction-buttons-${theme}`,
        );
      } finally {
        await close();
      }
    });
  }

  for (const theme of THEMES) {
    it(`show a debug report the member can copy, without their key (${theme})`, async () => {
      const { page, apiCalls, errors, close } = await openTornPage(browser, {
        page: "factions-controls",
        theme,
        api: { "GET /oc/config": respond(403, { error: "Your faction is not part of the Nuke Family." }) },
      });
      try {
        await page.locator("#nfh-debug-info-btn").click();
        const text = await page.locator("#nfh-debug-dialog textarea").inputValue();
        const report = JSON.parse(text);

        assert.ok(report.script.version);
        assert.equal(report.key.stored, true);
        assert.equal(report.key.accepted, true);
        assert.equal(report.site_now["/user/get-own-roles"].status, 200);
        assert.deepEqual(report.site_now["/oc/config"], {
          status: 403,
          error: "Your faction is not part of the Nuke Family.",
        });
        assert.equal(report.site_now["/oc/board"].present, true);
        // The page reached the site too (which refuses a call with no key).
        assert.deepEqual(report.site_from_page, { reached: true, status: 401, error: "Unauthenticated." });
        assert.ok("nfhOcConfig" in report.stored.stores);
        // The key itself is never in the report.
        const token = await page.evaluate(() => GM_getValue("apiToken", ""));
        assert.ok(token.length > 0);
        assert.ok(!text.includes(token));

        assert.deepEqual(errors, []);
        await screenshot(page.locator(".nfh-debug-dialog"), `debug-info-${theme}`);

        // Sending it swaps the long report for a reference short enough to pass on.
        await page.locator("[data-nfh-debug-send]").click();
        await page.locator(".nfh-debug-sent").waitFor();
        assert.equal(await page.locator(".nfh-debug-reference").inputValue(), "K7QM2X");
        assert.equal(await page.locator("[data-nfh-debug-send]").count(), 0);
        const posted = apiCalls.find((call) => call.method === "POST" && call.path === "/script/debug-report");
        assert.ok(posted, "the report was posted");
        await screenshot(page.locator(".nfh-debug-dialog"), `debug-info-sent-${theme}`);

        await page.locator("[data-nfh-debug-close]").click();
        assert.equal(await page.locator("#nfh-debug-dialog").count(), 0);
      } finally {
        await close();
      }
    });
  }

  it("say so when the report could not be sent, and still let it be copied", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-controls",
      api: { "POST /script/debug-report": respond(429, { message: "Too Many Attempts." }) },
    });
    try {
      await page.locator("#nfh-debug-info-btn").click();
      await page.locator("[data-nfh-debug-send]").click();
      await page.waitForFunction(() => /Too many reports sent from here/.test(document.querySelector(".nfh-debug-status").textContent));
      assert.equal(await page.locator(".nfh-debug-sent").isVisible(), false);
      assert.equal(await page.locator("[data-nfh-debug-send]").isEnabled(), true);
    } finally {
      await close();
    }
  });

  it("say how a request failed: a block page is not the same as no reply", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-controls",
      before: (page) =>
        page.evaluate(() => {
          const real = window.GM_xmlhttpRequest;
          window.GM_xmlhttpRequest = (details) => {
            if (details.url.endsWith("/oc/board")) return details.onerror(new Error("Network request failed"));
            if (details.url.endsWith("/oc/config")) return details.ontimeout();
            if (details.url.endsWith("/user/get-own-roles")) {
              return details.onload({ status: 403, responseText: "<!DOCTYPE html><title>Just a moment...</title>" });
            }
            if (details.url.endsWith("/cache/last-updates")) return details.onload({ status: 200, responseText: "<html>hi</html>" });
            if (details.url.endsWith("/user/get-own-permissions")) return details.onload(undefined);
            return real(details);
          };
        }),
    });
    try {
      await page.locator("#nfh-debug-info-btn").click();
      const site = JSON.parse(await page.locator("#nfh-debug-dialog textarea").inputValue()).site_now;

      assert.equal(site["/oc/board"].failure, "network");
      assert.equal(site["/oc/board"].detail, "Network request failed");
      assert.equal(site["/oc/config"].failure, "timeout");
      assert.equal(site["/user/get-own-permissions"].failure, "empty");
      assert.equal(site["/cache/last-updates"].failure, "not_json");
      assert.equal(site["/cache/last-updates"].status, 200);
      assert.equal(site["/cache/last-updates"].reply_starts, "<html>hi</html>");
      assert.equal(site["/user/get-own-roles"].status, 403);
      assert.match(site["/user/get-own-roles"].reply_starts, /Just a moment/);
    } finally {
      await close();
    }
  });

  it("send the report from the page when the userscript manager's request gets no answer", async () => {
    const { page, close } = await openTornPage(browser, {
      page: "factions-controls",
      before: (page) =>
        page.evaluate(() => {
          window.GM_xmlhttpRequest = (details) => details.onerror(new Error("bridge down"));
        }),
    });
    let posted = null;
    let authorization = "unset";
    await page.route("https://nuke.family/api/script/debug-report", (route) => {
      const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      posted = route.request().postDataJSON();
      authorization = route.request().headers().authorization;
      return route.fulfill({ status: 201, headers, contentType: "application/json", body: JSON.stringify({ reference: "PAGE22" }) });
    });
    try {
      await page.locator("#nfh-debug-info-btn").click();
      const report = JSON.parse(await page.locator("#nfh-debug-dialog textarea").inputValue());
      assert.equal(report.key.accepted, false);
      assert.equal(report.site_now["/oc/config"].failure, "network");
      assert.equal(report.site_from_page.reached, true);

      await page.locator("[data-nfh-debug-send]").click();
      await page.locator(".nfh-debug-sent").waitFor();
      assert.equal(await page.locator(".nfh-debug-reference").inputValue(), "PAGE22");
      assert.equal(posted.report.sent_by, "page");
      assert.equal(posted.report.send_failure.detail, "bridge down");
      // The page never sends the key.
      assert.equal(authorization, undefined);
    } finally {
      await close();
    }
  });

  it("are repaired after Torn rebuilds the panel", async () => {
    const { page, close } = await openTornPage(browser, { page: "factions-controls" });
    try {
      await page.waitForSelector("#nfh-change-key-btn");
      await page.evaluate(() => {
        document.querySelector("#nfh-change-key-btn").remove();
        document.querySelector("#nfh-check-updates-btn").remove();
        document.querySelector("#nfh-debug-info-btn").remove();
        // The dispatcher re-runs init on navigation.
        history.pushState({}, "", location.pathname + location.search + "#/tab=controls&x=1");
      });
      await page.waitForSelector("#nfh-change-key-btn");
      assert.equal(await page.locator("#nfh-change-key-btn").count(), 1);
    } finally {
      await close();
    }
  });
});
