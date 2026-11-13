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
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { makeBuildOptions } from "../../build-options.mjs";
import { setTheme } from "./theme.js";
import {
  cssDir,
  cssFileName,
  readMeta,
  stepHtml,
  stepNetwork,
  stepOf,
} from "../../tools/fixture-recorder/store.mjs";

// fileURLToPath (not .pathname) so this also works on Windows. ROOT ends with a
// path separator; the forward slashes appended below are fine on every OS.
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
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

// Fixtures live in the private fixtures repository (tools/fixture-recorder/
// store.mjs has the layout). meta.json says where each came from.
export { listFixtures, readMeta as fixtureMeta } from "../../tools/fixture-recorder/store.mjs";

// Fixture name -> the real Torn URL a step is served at.
export function fixtureUrl(name, step = 0) {
  const meta = readMeta(name);
  return stepOf(meta, step).url || meta.url;
}

// Torn's own stylesheets, captured with the pages (fixtures/torn-css). If a
// fixture references one that is missing the page renders unstyled: capture
// the page again with the recorder, or run `npm run fixtures:css`.
let warnedNoCss = false;
function tornCss(requestUrl) {
  const { pathname, search } = new URL(requestUrl);
  const file = `${cssDir()}/${cssFileName(pathname + search)}`;
  if (existsSync(file)) return readFileSync(file);
  if (!warnedNoCss) {
    warnedNoCss = true;
    console.warn(`[harness] Torn CSS not found (${pathname}); capture the page again or run "npm run fixtures:css".`);
  }
  return null;
}

export function loadPageFixture(name, step = 0) {
  return stepHtml(name, step);
}

// Torn's own XHR/fetch responses recorded with a step (see store.mjs).
export function loadNetwork(name, step = 0) {
  return stepNetwork(name, step);
}

// Move an open fixture page on to a later recorded step, the way Torn's own
// scripts would have: the subtree that changed (`changedRoot`, recorded by the
// recorder) is swapped for the step's version, so MutationObservers fire as on
// the live page, and the URL hash follows the step (firing hashchange). With
// no changedRoot the whole body is swapped.
export async function gotoStep(page, name, n) {
  const step = stepOf(readMeta(name), n);
  const html = stepHtml(name, n);
  await page.evaluate(
    ({ html, root, hash }) => {
      const next = new DOMParser().parseFromString(html, "text/html");
      const ours = (el) => el.matches?.('[id^="nfh-"], [class^="nfh-"], [class*=" nfh-"]');
      if (root) {
        const live = document.querySelector(root);
        const fresh = next.querySelector(root);
        if (!live || !fresh) throw new Error(`gotoStep: "${root}" not found in ${live ? "the step" : "the page"}`);
        live.replaceWith(document.importNode(fresh, true));
      } else {
        // Keep our own injected top-level elements (banner etc.) like Torn would.
        const keep = [...document.body.children].filter(ours);
        document.body.replaceChildren(...[...next.body.childNodes].map((c) => document.importNode(c, true)), ...keep);
      }
      if (hash !== undefined && hash !== location.hash) location.hash = hash;
    },
    { html, root: step.changedRoot || null, hash: step.url ? new URL(step.url).hash : undefined },
  );
  return step;
}

export async function launch() {
  return chromium.launch();
}

// A step captured in Torn's phone layout (784px or narrower) opens at the
// width it was captured at, so the page shows that layout here too.
function capturedViewport(name, step) {
  const width = stepOf(readMeta(name), step)?.layout?.innerWidth;
  return width && width <= 784 ? { width, height: 900 } : { width: 1280, height: 1000 };
}

// Open a fixture page with the script injected.
//
// options:
//   page        fixture name in test/fixtures/pages (without .html)
//   step        which recorded step to load (default 0; see gotoStep)
//   url         the Torn URL the fixture is served at (default: the step's)
//   theme       "light" | "dark" (default "light")
//   api         { "GET /path": body | (details) => body | {status, body} }
//               merged over test/fixtures/api/default.json
//   gmValues    initial GM storage; defaults to a valid-looking API token
//   localStorage initial localStorage entries
//   before      async (page) => {} run after the fixture loads and the theme
//               is set, but before the script is injected (to tweak the DOM,
//               e.g. give the profile a faction link)
//   cookies     extra cookies (uid defaults to 1)
//   viewport    { width, height }; defaults to 1280 wide, or the captured
//               width when the step was taken in Torn's phone layout
//
// Returns { page, apiCalls, dialogs, errors, close }.
export async function openTornPage(browser, options) {
  const {
    page: pageName,
    step = 0,
    url = fixtureUrl(options.page, options.step ?? 0),
    theme = "light",
    api = {},
    gmValues = { apiToken: "x".repeat(50), apiTokenFirstTime: true },
    localStorage = {},
    before,
    viewport = capturedViewport(options.page, options.step ?? 0),
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
        body: loadPageFixture(pageName, step),
      });
    }
    if (new URL(requested).origin === "https://www.torn.com" && /\.css$/.test(new URL(requested).pathname)) {
      const css = tornCss(requested);
      if (css) return route.fulfill({ contentType: "text/css", body: css });
    }
    // A request the page makes to nuke.family itself (the debug report's own
    // check): the site's answer to a call with no key. A test wanting another
    // answer adds its own page.route() for the URL.
    if (requested.startsWith(API_PREFIX)) {
      const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*" };
      if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
      return route.fulfill({
        status: 401,
        headers,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthenticated." }),
      });
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
    apiCalls.push({ method, path, data: details.data, headers: details.headers || {} });
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
        .__nfhRequest({ method: details.method, url: details.url, data: details.data, headers: details.headers })
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
