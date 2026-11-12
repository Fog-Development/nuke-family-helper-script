// The fixture store: captured Torn pages kept in their own private git
// repository at <repo>/fixtures (gitignored here, see fixtures/README.md).
// Shared by the test harness, the recorder's companion server and the
// fixtures CLI, so every one of them reads and writes the same layout:
//
//   fixtures/
//     pages/<id>/meta.json            where it came from, theme, width, steps
//     pages/<id>/step-00.html         the page as captured (scripts made inert)
//     pages/<id>/step-01.html         the page after the next recorded action
//     pages/<id>/network/step-01-00-<slug>.json   Torn's own responses seen
//     pages/<id>/screens/step-00.png  full-page screenshot of the real page
//     torn-css/<encoded path>         Torn's stylesheets, served by the harness
//     wanted.json                     captures Claude has asked for
//
// NFH_FIXTURES points somewhere else (another checkout of the private repo).
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../../", import.meta.url));

export function fixturesDir() {
  return resolve(process.env.NFH_FIXTURES || join(REPO, "fixtures"));
}
export const pagesDir = () => join(fixturesDir(), "pages");
export const cssDir = () => join(fixturesDir(), "torn-css");
export const hasFixtures = () => existsSync(pagesDir());

export const MISSING_FIXTURES_HELP =
  "No fixtures found at " +
  fixturesDir() +
  ". They live in a private repository: clone it into fixtures/ (see test/README.md), " +
  "or point NFH_FIXTURES at a checkout.";

function requireFixtures() {
  if (!hasFixtures()) throw new Error(MISSING_FIXTURES_HELP);
}

// Fixture ids become directory names, so keep them to a safe alphabet.
export function validId(id) {
  return typeof id === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(id);
}

export function listFixtures() {
  if (!hasFixtures()) return [];
  return readdirSync(pagesDir(), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(pagesDir(), d.name, "meta.json")))
    .map((d) => readMeta(d.name))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function readMeta(id) {
  requireFixtures();
  const file = join(pagesDir(), id, "meta.json");
  if (!existsSync(file)) throw new Error(`No fixture "${id}" (${file})`);
  return JSON.parse(readFileSync(file, "utf8"));
}

export function stepOf(meta, n = 0) {
  const step = meta.steps.find((s) => s.n === n);
  if (!step) throw new Error(`Fixture "${meta.id}" has no step ${n} (it has ${meta.steps.length})`);
  return step;
}

export function stepHtml(id, n = 0) {
  const step = stepOf(readMeta(id), n);
  return readFileSync(join(pagesDir(), id, step.file), "utf8");
}

// The recorded network entries for a step: Torn's own XHR/fetch responses
// that arrived since the step before (parsed JSON in `response` when it was
// JSON, else `responseText`).
export function stepNetwork(id, n = 0) {
  const step = stepOf(readMeta(id), n);
  return (step.network || []).map((file) =>
    JSON.parse(readFileSync(join(pagesDir(), id, file), "utf8")),
  );
}

// ---- URL routes -------------------------------------------------------------
// Two captures are "the same page" when their route keys match: the path, the
// query and the hash route, minus parameters that only pick a record (a
// player, property or page offset). Torn's hash is either a path ("#/war/rank")
// or parameters ("#/tab=controls&option=members").
const VOLATILE = new Set(["ID", "XID", "userID", "start", "rfcv", "_"]);

function paramsKey(params) {
  return [...params]
    .filter(([k]) => !VOLATILE.has(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

export function routeKey(url) {
  const u = new URL(url);
  let hash = u.hash.replace(/^#\/?/, "");
  if (hash.includes("=")) hash = paramsKey(new URLSearchParams(hash));
  return `${u.pathname}?${paramsKey(u.searchParams)}#${hash}`;
}

// ---- wanted captures --------------------------------------------------------
const wantedFile = () => join(fixturesDir(), "wanted.json");

export function readWanted() {
  if (!existsSync(wantedFile())) return [];
  return JSON.parse(readFileSync(wantedFile(), "utf8"));
}

export function wantedFor(url) {
  return readWanted().filter((w) => {
    try {
      return w.match ? new RegExp(w.match).test(url) : routeKey(w.url) === routeKey(url);
    } catch {
      return false;
    }
  });
}

function markWantedDone(wantedId, fixtureId) {
  const wanted = readWanted();
  const entry = wanted.find((w) => w.id === wantedId);
  if (!entry) return;
  entry.status = "done";
  entry.fixture = fixtureId;
  entry.doneAt = new Date().toISOString();
  writeFileSync(wantedFile(), JSON.stringify(wanted, null, 2) + "\n");
}

// ---- writing captures -------------------------------------------------------
const pad = (n) => String(n).padStart(2, "0");
const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "x";

export const cssFileName = (pathAndQuery) => encodeURIComponent(pathAndQuery);
export const hasCss = (pathAndQuery) => existsSync(join(cssDir(), cssFileName(pathAndQuery)));

// Save one captured step.
//   capture.id        fixture id
//   capture.mode      "new" (fails if it exists), "replace" (wipes the old
//                     fixture first) or "append" (adds the next step)
//   capture.title / notes / wantedId    for the fixture (new/replace)
//   capture.step      { html, url, pageTitle, theme, layout, trigger, label,
//                       actions, changedRoot, scroll, otherScripts, userAgent }
//   capture.network   [{ method, url, status, contentType, requestBody,
//                        responseText, truncated, at }]
//   capture.css       { "/path.css?v": "text" } stylesheets the store lacks
//   capture.screenshot  "data:image/png;base64,..."
// Returns { meta, step }.
export function writeCapture(capture) {
  const { id, mode = "new" } = capture;
  if (!validId(id)) throw new Error(`Bad fixture id "${id}": use a-z, 0-9 and dashes`);
  mkdirSync(pagesDir(), { recursive: true });
  const dir = join(pagesDir(), id);
  const exists = existsSync(join(dir, "meta.json"));
  if (mode === "new" && exists) throw new Error(`Fixture "${id}" already exists (refresh it instead)`);
  if (mode === "append" && !exists) throw new Error(`Fixture "${id}" does not exist to append to`);
  if (mode === "replace" && exists) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  const now = new Date().toISOString();
  const meta =
    mode === "append"
      ? readMeta(id)
      : {
          id,
          title: capture.title || id,
          url: capture.step.url,
          notes: capture.notes || "",
          source: "recorder",
          wantedId: capture.wantedId || undefined,
          createdAt: now,
          steps: [],
        };
  const n = meta.steps.length;
  const { html, ...stepInfo } = capture.step;
  const step = { n, file: `step-${pad(n)}.html`, capturedAt: now, ...stepInfo };
  writeFileSync(join(dir, step.file), html);

  if (capture.network?.length) {
    mkdirSync(join(dir, "network"), { recursive: true });
    step.network = capture.network.map((entry, i) => {
      const name = `network/step-${pad(n)}-${pad(i)}-${slug(new URL(entry.url).pathname + new URL(entry.url).search)}.json`;
      const out = { ...entry };
      try {
        out.response = JSON.parse(entry.responseText);
        delete out.responseText;
      } catch {
        // not JSON: keep the text
      }
      writeFileSync(join(dir, name), JSON.stringify(out, null, 2) + "\n");
      return name;
    });
  }
  if (capture.screenshot?.startsWith("data:image/png;base64,")) {
    mkdirSync(join(dir, "screens"), { recursive: true });
    step.screenshot = `screens/step-${pad(n)}.png`;
    writeFileSync(join(dir, step.screenshot), Buffer.from(capture.screenshot.split(",")[1], "base64"));
  }
  if (capture.css) {
    mkdirSync(cssDir(), { recursive: true });
    for (const [href, text] of Object.entries(capture.css)) {
      if (!href.startsWith("/")) continue;
      writeFileSync(join(cssDir(), cssFileName(href)), text);
    }
  }

  meta.steps.push(step);
  meta.updatedAt = now;
  writeFileSync(join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  if (capture.wantedId && mode !== "append") markWantedDone(capture.wantedId, id);
  return { meta, step };
}
