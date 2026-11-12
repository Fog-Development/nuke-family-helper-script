// The fixture recorder: companion server + store, the extension's panel
// (content.js, run in Chromium with the extension API stubbed, on a small
// made-up page; never on Torn) and the background network log.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { after, before, describe, it } from "node:test";
import { chromium } from "playwright";

const TMP = mkdtempSync(join(tmpdir(), "nfh-fixtures-"));
process.env.NFH_FIXTURES = TMP;
const store = await import("../../tools/fixture-recorder/store.mjs");
const { startServer } = await import("../../tools/fixture-recorder/server.mjs");
const CONTENT = readFileSync(new URL("../../tools/fixture-recorder/extension/content.js", import.meta.url), "utf8");
// background.js is a plain browser script; run it with a CommonJS-style module.
const sandbox = { module: { exports: {} }, TextDecoder, TextEncoder, URL, Uint8Array, Date };
runInNewContext(readFileSync(new URL("../../tools/fixture-recorder/extension/background.js", import.meta.url), "utf8"), sandbox);
const { makeNetworkLog, redactUrl, requestBodyOf } = sandbox.module.exports;

after(() => rmSync(TMP, { recursive: true, force: true }));

const PAGE_URL = "https://www.torn.com/factions.php?step=your&type=1#/tab=controls&option=members";
const step = (extra = {}) => ({
  html: "<html><body class='dark-mode'><div id='x'>hi</div></body></html>",
  url: PAGE_URL,
  pageTitle: "Factions | TORN",
  theme: "dark",
  layout: { name: "desktop", innerWidth: 1280, container: 976, content: 784 },
  trigger: "manual",
  ...extra,
});

describe("fixture store + companion server", () => {
  let server;
  let base;
  before(async () => {
    writeFileSync(
      join(TMP, "wanted.json"),
      JSON.stringify([{ id: "members-list", url: PAGE_URL, theme: "dark", instructions: "Open members", status: "open" }]),
    );
    server = await startServer({ port: 0, quiet: true });
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => server.close());

  const call = (path, body, headers = {}) =>
    fetch(base + path, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", ...headers },
      body: body && JSON.stringify(body),
    });

  it("route keys ignore record ids and parameter order", () => {
    assert.equal(
      store.routeKey("https://www.torn.com/properties.php#/p=options&ID=6328306&tab=offerExtension"),
      store.routeKey("https://www.torn.com/properties.php#/tab=offerExtension&p=options&ID=1"),
    );
    assert.notEqual(
      store.routeKey("https://www.torn.com/factions.php?step=your#/tab=armoury&sub=utilities"),
      store.routeKey("https://www.torn.com/factions.php?step=your#/tab=armoury&sub=weapons"),
    );
  });

  it("refuses requests from web pages", async () => {
    const res = await call("/api/status", undefined, { origin: "https://evil.example" });
    assert.equal(res.status, 403);
  });

  it("saves a capture with network, screenshot and css, and marks the wanted entry done", async () => {
    const png = "data:image/png;base64," + Buffer.from("png").toString("base64");
    const res = await call("/api/capture", {
      id: "members-list",
      mode: "new",
      title: "Members",
      wantedId: "members-list",
      step: step({ label: "start" }),
      network: [{ method: "GET", url: "https://www.torn.com/factions.php?step=getMembers", status: 200, responseText: '{"a":1}' }],
      css: { "/builds/x.css?v=1": "body{}" },
      screenshot: png,
    });
    assert.equal(res.status, 200, await res.clone().text());
    const meta = store.readMeta("members-list");
    assert.equal(meta.steps.length, 1);
    assert.equal(meta.steps[0].theme, "dark");
    assert.deepEqual(store.stepNetwork("members-list", 0)[0].response, { a: 1 });
    assert.ok(existsSync(join(TMP, "pages/members-list/screens/step-00.png")));
    assert.ok(store.hasCss("/builds/x.css?v=1"));
    assert.equal(store.readWanted()[0].status, "done");
  });

  it("refuses a duplicate new capture, appends steps, and replaces on request", async () => {
    assert.equal((await call("/api/capture", { id: "members-list", mode: "new", step: step() })).status, 400);
    await call("/api/capture", { id: "members-list", mode: "append", step: step({ changedRoot: "#x", actions: [{ type: "click", text: "Kick" }] }) });
    assert.equal(store.readMeta("members-list").steps[1].changedRoot, "#x");
    assert.match(store.stepHtml("members-list", 1), /hi/);
    await call("/api/capture", { id: "members-list", mode: "replace", step: step() });
    assert.equal(store.readMeta("members-list").steps.length, 1);
  });

  it("rejects ids that are not safe directory names", async () => {
    assert.equal((await call("/api/capture", { id: "../evil", mode: "new", step: step() })).status, 400);
  });

  it("reports coverage, wanted entries and contracts for a URL", async () => {
    const url = "https://www.torn.com/factions.php?type=1&step=your#/option=members&tab=controls";
    const body = await (await call(`/api/coverage?url=${encodeURIComponent(url)}`)).json();
    assert.deepEqual(body.fixtures.map((f) => f.id), ["members-list"]);
    assert.equal(body.wanted.length, 1);
    const exact = await (await call(`/api/coverage?url=${encodeURIComponent(PAGE_URL)}`)).json();
    assert.ok(exact.contracts.some((c) => c.id === "faction-controls"));
    const css = await (await call("/api/css/missing", { hrefs: ["/builds/x.css?v=1", "/new.css"] })).json();
    assert.deepEqual(css.missing, ["/new.css"]);
  });
});

describe("harness gotoStep", () => {
  it("swaps in the changed subtree of a later step and follows its hash", async () => {
    const { gotoStep } = await import("../harness/torn.js");
    const list = (extra) => `<html><body><ul id="m"><li class="row___a1">Alice ${extra}</li></ul><div id="nfh-x">ours</div></body></html>`;
    store.writeCapture({ id: "steps", mode: "new", step: step({ html: list("") }) });
    store.writeCapture({
      id: "steps",
      mode: "append",
      step: step({ html: list("<div class='confirm'>Kick?</div>"), changedRoot: "#m", url: PAGE_URL.replace("members", "news") }),
    });
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(store.stepHtml("steps", 0));
      await page.evaluate(() => {
        window.mutated = 0;
        new MutationObserver(() => window.mutated++).observe(document.body, { childList: true, subtree: true });
      });
      await gotoStep(page, "steps", 1);
      assert.equal(await page.locator("#m .confirm").textContent(), "Kick?");
      assert.ok(await page.evaluate(() => window.mutated > 0));
      assert.match(await page.evaluate(() => location.hash), /option=news/);
    } finally {
      await browser.close();
    }
  });
});

describe("background network log", () => {
  it("records responses per tab, redacts secrets and starts over on a new page", () => {
    const log = makeNetworkLog();
    log.start({ requestId: "1", tabId: 5, method: "POST", url: "https://www.torn.com/x.php?rfcv=abc&step=1", requestBody: { formData: { rfcv: ["abc"], step: ["1"] } } });
    log.headers({ requestId: "1", statusCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }] });
    log.data("1", new TextEncoder().encode('{"ok":').buffer);
    log.data("1", new TextEncoder().encode("true}").buffer);
    log.finish("1");
    const { entries, lastSeq } = log.since(5);
    assert.equal(entries[0].responseText, '{"ok":true}');
    assert.match(entries[0].url, /rfcv=REDACTED/);
    assert.equal(entries[0].requestBody.formData.rfcv[0], "REDACTED");
    assert.equal(log.since(5, lastSeq).entries.length, 0);
    log.clearTab(5);
    assert.equal(log.since(5).entries.length, 0);
    assert.match(redactUrl("https://www.torn.com/page.php?sid=stocks"), /sid=stocks/);
    assert.equal(requestBodyOf({}), undefined);
  });
});

describe("recorder panel (content.js)", () => {
  let browser;
  before(async () => {
    browser = await chromium.launch();
  });
  after(() => browser.close());

  const TEST_PAGE = `<!DOCTYPE html><html><head><title>Factions | TORN</title><script>window.tornThing = 1;</script></head>
    <body class="dark-mode"><div id="mainContainer" style="width:976px"><div class="content-wrapper" style="width:784px">
      <div id="faction-controls"><hr><input id="search" value=""><iframe id="editor" srcdoc="<p>hello frame</p>"></iframe>
        <ul class="members-list"><li class="row___ab12C">Alice <button class="kick">Kick</button></li></ul></div>
    </div></div>
    <script>document.querySelector(".kick").addEventListener("click", (e) => {
      const d = document.createElement("div"); d.className = "confirm"; d.textContent = "Kick Alice?";
      e.target.closest("li").appendChild(d);
    });</script></body></html>`;

  async function open({ contracts = [], incognito = true, resizes = true } = {}) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route("**/*", (route) =>
      route.request().url().split("#")[0] === PAGE_URL.split("#")[0]
        ? route.fulfill({ contentType: "text/html", body: TEST_PAGE })
        : route.abort(),
    );
    const sent = [];
    await page.exposeFunction("__recorderSent", (m) => sent.push(m));
    // The window resize the background script would do, as a viewport change.
    await page.exposeFunction("__recorderResize", (width) => page.setViewportSize({ width, height: 900 }));
    await page.addInitScript(({ contracts, incognito, resizes }) => {
      let steps = 0;
      const reply = async (m) => {
        window.__recorderSent(m);
        if (m.type === "network") return { entries: [{ seq: 1, url: "https://www.torn.com/x", responseText: "{}" }], lastSeq: 1 };
        if (m.type === "screenshot") return { ok: true, dataUrl: "data:image/png;base64,AAAA" };
        if (m.type === "resize") {
          if (resizes) await window.__recorderResize(m.width);
          return { ok: true };
        }
        if (m.type === "zoom") return { ok: true, zoom: m.cssWidth / m.width };
        if (m.type === "restore") {
          await window.__recorderResize(1280);
          return { ok: true };
        }
        if (m.type !== "server") return undefined;
        if (m.path === "/api/status") return { ok: true, data: { fixtures: 0, wantedOpen: 0, isRepo: true } };
        if (m.path.startsWith("/api/coverage")) return { ok: true, data: { fixtures: [], wanted: [], contracts } };
        if (m.path === "/api/css/missing") return { ok: true, data: { missing: [] } };
        if (m.path === "/api/capture") {
          steps = m.body.mode === "append" ? steps + 1 : 1;
          return { ok: true, data: { ok: true, id: m.body.id, step: steps - 1, steps } };
        }
      };
      window.browser = {
        runtime: { sendMessage: reply, onMessage: { addListener() {} } },
        extension: { inIncognitoContext: incognito },
        storage: { local: { get: async (d) => ({ ...d, collapsed: false, screenshot: true }), set: async () => {} } },
      };
    }, { contracts, incognito, resizes });
    await page.goto(PAGE_URL);
    await page.addScriptTag({ content: CONTENT });
    if (!incognito) return { page, sent };
    await page.waitForFunction(() => document.getElementById("nfh-recorder-host")?.shadowRoot?.querySelector(".panel"));
    return { page, sent, captures: () => sent.filter((m) => m.path === "/api/capture").map((m) => m.body) };
  }
  const shadowButton = (page, act) => page.locator(`#nfh-recorder-host >> [data-act="${act}"]`);

  it("captures the page as you see it, without itself and with scripts made inert", async () => {
    const { page, captures } = await open();
    await page.fill("#search", "Alice");
    await shadowButton(page, "capture").click();
    await page.waitForFunction(() => window.__nfhRecorderTest.state.message?.kind === "ok");
    const [capture] = captures();
    assert.equal(capture.id, "factions-controls-members");
    assert.equal(capture.mode, "new");
    const { html, theme, layout, url } = capture.step;
    assert.equal(theme, "dark");
    assert.equal(layout.name, "desktop");
    assert.equal(url, PAGE_URL);
    assert.ok(!html.includes(`id="nfh-recorder-host"`), "the panel is not in the capture");
    assert.match(html, /type="text\/x-nfh-disabled"/);
    assert.ok(!/<script>/.test(html), "no live script tags");
    assert.match(html, /id="search" value="Alice"/);
    assert.match(html, /srcdoc="[^"]*hello frame/);
    assert.equal(capture.network.length, 1);
    assert.ok(!("seq" in capture.network[0]));
    assert.match(capture.screenshot, /^data:image\/png/);
    await page.close();
  });

  it("records a scenario: your click becomes a step with the changed subtree", async () => {
    const { page, captures } = await open();
    await shadowButton(page, "start").click();
    await page.waitForFunction(() => window.__nfhRecorderTest.state.scenario);
    await page.click(".kick");
    await page.waitForFunction(() => window.__nfhRecorderTest.state.scenario?.steps === 2, null, { timeout: 5000 });
    const [start, after] = captures();
    assert.equal(start.step.trigger, "start");
    assert.equal(after.mode, "append");
    assert.equal(after.step.trigger, "auto");
    assert.equal(after.step.actions[0].type, "click");
    assert.equal(after.step.actions[0].text, "Kick");
    assert.match(after.step.label, /after click "Kick"/);
    assert.match(after.step.html, /Kick Alice\?/);
    // The changed subtree is the row the dialog went into, found the same way in the capture.
    assert.equal(await page.locator(after.step.changedRoot).count(), 1);
    assert.match(after.step.changedRoot, /\[class\*="row___"\]/);
    await shadowButton(page, "finish").click();
    await page.close();
  });

  it("stays off in a normal (non-private) window", async () => {
    const { page, sent } = await open({ incognito: false });
    await page.waitForTimeout(300);
    assert.equal(await page.locator("#nfh-recorder-host").count(), 0);
    assert.equal(sent.length, 0, "nothing sent to the companion");
    assert.equal(await page.evaluate(() => window.__nfhRecorderTest.state.off), true);
    await page.close();
  });

  it("switches to the phone layout by resizing the window, and restores it", async () => {
    const MOBILE_CSS = `@media (max-width: 784px) { .content-wrapper { width: 386px !important; } }`;
    const { page, sent } = await open();
    await page.addStyleTag({ content: MOBILE_CSS });
    await page.locator('#nfh-recorder-host >> [data-act="width"][data-layout="mobile"]').click();
    await page.waitForFunction(() => window.__nfhRecorderTest.state.message?.text.startsWith("Now mobile"));
    assert.ok(!sent.some((m) => m.type === "zoom"), "no zoom needed");
    assert.equal(await page.evaluate(() => innerWidth), 412);
    await shadowButton(page, "restore-width").click();
    await page.waitForFunction(() => window.__nfhRecorderTest.state.message?.text.startsWith("Restored"));
    assert.equal(await page.evaluate(() => innerWidth), 1280);
    await page.close();
  });

  it("zooms the tab when the window will not get narrow enough", async () => {
    const { page, sent } = await open({ resizes: false });
    await page.locator('#nfh-recorder-host >> [data-act="width"][data-layout="mobile"]').click();
    await page.waitForFunction(() => window.__nfhRecorderTest.state.message && !window.__nfhRecorderTest.state.busy);
    const zoom = sent.find((m) => m.type === "zoom");
    assert.deepEqual([zoom.width, zoom.cssWidth], [412, 1280]);
    await page.close();
  });

  it("shows page contracts and a badge when one breaks", async () => {
    const contracts = [
      { id: "ok", feature: "a", url: ".", expect: [{ selector: "#faction-controls > hr" }] },
      { id: "broken", feature: "b", url: ".", expect: [{ selector: ".gone" }], fixtures: ["x"] },
      { id: "waiting", feature: "c", url: ".", when: ".not-yet", expect: [{ selector: ".gone" }] },
    ];
    const { page } = await open({ contracts });
    await page.waitForFunction(() => window.__nfhRecorderTest.state.contractResults.length === 3);
    const statuses = await page.evaluate(() => window.__nfhRecorderTest.state.contractResults.map((c) => c.status));
    assert.deepEqual(statuses, ["ok", "broken", "waiting"]);
    assert.match(await page.locator("#nfh-recorder-host >> .badge").textContent(), /✗ 1/);
    await page.close();
  });
});
