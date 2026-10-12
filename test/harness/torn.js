// Test harness for the userscript: loads a Torn-page fixture into a real
// browser at the real Torn URL, stubs the userscript-manager APIs (GM_*) and
// the nuke.family API, injects a fresh build of the script, and hands back the
// page for assertions and screenshots.
//
// The Torn page itself is a fixture (see test/README.md), so this verifies our
// injected UI against recorded DOM structure, not against live Torn.
import { build } from "esbuild";
import { existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { makeBuildOptions } from "../../build-options.mjs";
import { setTheme } from "./theme.js";

const ROOT = new URL("../../", import.meta.url).pathname;
const API_PREFIX = "https://nuke.family/api"; // production build (debug off)
const SCREENSHOT_DIR = `${ROOT}test/screenshots`;

let scriptSource;
// Bundle the current src/ once per test process, in memory.
async function builtScript() {
  if (!scriptSource) {
    const result = await build({
      ...makeBuildOptions(),
      outfile: undefined,
      write: false,
    });
    scriptSource = result.outputFiles[0].text;
  }
  return scriptSource;
}

export function loadApiFixture(name = "default") {
  return JSON.parse(
    readFileSync(`${ROOT}test/fixtures/api/${name}.json`, "utf8"),
  );
}

// Fixture name -> the real Torn URL it is served at (test/fixtures/pages/manifest.json).
export function fixtureUrl(name) {
  const manifest = JSON.parse(
    readFileSync(`${ROOT}test/fixtures/pages/manifest.json`, "utf8"),
  );
  if (!manifest[name]) throw new Error(`No URL for fixture "${name}" in manifest.json`);
  return manifest[name];
}

// Torn's own stylesheets are not committed; `npm run fixtures:css` downloads
// the ones the fixtures reference. Without them pages render unstyled.
const CSS_DIR = `${ROOT}test/fixtures/torn-css`;
let warnedNoCss = false;
function tornCss(requestUrl) {
  const { pathname, search } = new URL(requestUrl);
  const file = `${CSS_DIR}/${encodeURIComponent(pathname + search)}`;
  if (existsSync(file)) return readFileSync(file);
  if (!warnedNoCss) {
    warnedNoCss = true;
    console.warn(`[harness] Torn CSS not found (${pathname}); run "npm run fixtures:css" for realistic styling.`);
  }
  return null;
}

export function loadPageFixture(name) {
  return readFileSync(`${ROOT}test/fixtures/pages/${name}.html`, "utf8");
}

export async function launch() {
  return chromium.launch();
}

// Open a fixture page with the script injected.
//
// options:
//   page        fixture name in test/fixtures/pages (without .html)
//   url         the Torn URL the fixture is served at (default: manifest.json)
//   theme       "light" | "dark" (default "light")
//   api         { "GET /path": body | (details) => body | {status, body} }
//               merged over test/fixtures/api/default.json
//   gmValues    initial GM storage; defaults to a valid-looking API token
//   localStorage initial localStorage entries
//   before      async (page) => {} run after the fixture loads and the theme
//               is set, but before the script is injected (to tweak the DOM,
//               e.g. give the profile a faction link)
//   cookies     extra cookies (uid defaults to 1)
//
// Returns { page, apiCalls, dialogs, errors, close }.
export async function openTornPage(browser, options) {
  const {
    page: pageName,
    url = fixtureUrl(options.page),
    theme = "light",
    api = {},
    gmValues = { apiToken: "x".repeat(50), apiTokenFirstTime: true },
    localStorage = {},
    before,
    viewport = { width: 1280, height: 1000 },
  } = options;

  const context = await browser.newContext({ viewport });
  await context.addCookies([
    { name: "uid", value: "1", url: new URL(url).origin },
  ]);
  const page = await context.newPage();

  const routes = { ...loadApiFixture(), ...api };
  const apiCalls = [];
  const dialogs = [];
  const errors = [];

  page.on("dialog", (dialog) => {
    dialogs.push({ type: dialog.type(), message: dialog.message() });
    dialog.dismiss();
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) {
      errors.push(msg.text());
    }
  });

  // Serve the fixture at the real Torn URL (so IsPage() matches) and block
  // everything else: tests must never touch the network.
  await page.route("**/*", (route) => {
    const request = route.request();
    const requested = request.url();
    // Fragments are never sent in requests, so compare without the hash.
    if (requested === url.split("#")[0]) {
      return route.fulfill({
        contentType: "text/html",
        body: loadPageFixture(pageName),
      });
    }
    if (new URL(requested).origin === "https://www.torn.com" && /\.css$/.test(new URL(requested).pathname)) {
      const css = tornCss(requested);
      if (css) return route.fulfill({ contentType: "text/css", body: css });
    }
    // Images, fonts, anything else: an empty 200 so nothing hits the network
    // and the page does not log failed-resource errors.
    return route.fulfill({ status: 200, body: "" });
  });

  // The userscript-manager environment. GM_xmlhttpRequest is routed to the API
  // routes above via an exposed function.
  await page.exposeFunction("__nfhRequest", (details) => {
    const { method = "GET", url: requestUrl } = details;
    if (!requestUrl.startsWith(API_PREFIX)) {
      // The update checker's GitHub fetch: report "no newer version".
      return { status: 200, responseText: "// @version 0.0.0" };
    }
    const path = requestUrl.slice(API_PREFIX.length);
    apiCalls.push({ method, path, data: details.data });
    const route = routes[`${method} ${path}`];
    if (route === undefined) {
      return { status: 404, responseText: JSON.stringify({ message: "no route" }) };
    }
    const result = typeof route === "function" ? route(details) : route;
    const { status = 200, body } =
      result && result.__response ? result : { body: result };
    return { status, responseText: JSON.stringify(body) };
  });
  await page.addInitScript((initialValues) => {
    const store = { ...initialValues };
    window.GM_getValue = (key, fallback) => (key in store ? store[key] : fallback);
    window.GM_setValue = (key, value) => {
      store[key] = value;
    };
    window.GM_info = { script: { version: "test" }, scriptHandler: "Tampermonkey" };
    window.GM_xmlhttpRequest = (details) => {
      window
        .__nfhRequest({ method: details.method, url: details.url, data: details.data })
        .then(details.onload, details.onerror);
    };
    window.__gmStore = store;
  }, gmValues);
  await page.addInitScript((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  }, localStorage);

  await page.goto(url);
  await setTheme(page, theme);
  if (before) await before(page);
  await page.addScriptTag({ content: await builtScript() });

  return {
    page,
    apiCalls,
    dialogs,
    errors,
    close: () => context.close(),
  };
}

// Save a screenshot of a locator/page into test/screenshots (gitignored) for
// visual inspection, and return its path.
export async function screenshot(target, name) {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
  const path = `${SCREENSHOT_DIR}/${name}.png`;
  await target.screenshot({ path });
  return path;
}

// Wrap a response so a route can return a non-200 status.
export function respond(status, body) {
  return { __response: true, status, body };
}
