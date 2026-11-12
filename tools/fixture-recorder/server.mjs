// Companion server for the fixture recorder extension: receives captures from
// the browser and writes them into the fixture store (store.mjs), and tells the
// extension what is already covered for the page being viewed, what captures
// are wanted, and which page contracts apply.
//
//   npm run recorder             listens on http://127.0.0.1:47821
//   NFH_RECORDER_PORT=...        another port (set the same in the extension)
//
// It listens on the loopback address only and refuses requests from web pages
// (any Origin other than the extension's), so a site you visit cannot write
// into or read from the fixtures.
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fixturesDir,
  hasCss,
  listFixtures,
  readWanted,
  routeKey,
  wantedFor,
  writeCapture,
} from "./store.mjs";

const REPO = fileURLToPath(new URL("../../", import.meta.url));
export const DEFAULT_PORT = 47821;
const MAX_BODY = 150 * 1024 * 1024;

// Page contracts: the Torn selectors each feature relies on (test/page-contracts.json).
export function readContracts() {
  const file = join(REPO, "test", "page-contracts.json");
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).contracts : [];
}
const contractsFor = (url) =>
  readContracts().filter((c) => {
    try {
      return new RegExp(c.url).test(url);
    } catch {
      return false;
    }
  });

function summary(meta, url) {
  const themes = [...new Set(meta.steps.map((s) => s.theme).filter(Boolean))];
  const layouts = [...new Set(meta.steps.map((s) => s.layout?.name).filter(Boolean))];
  return {
    id: meta.id,
    title: meta.title,
    url: meta.url,
    notes: meta.notes,
    source: meta.source,
    steps: meta.steps.length,
    labels: meta.steps.map((s) => s.label || s.trigger),
    themes,
    layouts,
    updatedAt: meta.updatedAt,
    exact: url ? meta.url === url : undefined,
  };
}

function coverage(url) {
  const key = routeKey(url);
  const fixtures = listFixtures()
    .filter((m) => m.steps.some((s) => s.url && routeKey(s.url) === key) || routeKey(m.url) === key)
    .map((m) => summary(m, url));
  return { url, route: key, fixtures, wanted: wantedFor(url), contracts: contractsFor(url) };
}

function allowed(req) {
  const origin = req.headers.origin;
  return !origin || origin.startsWith("moz-extension://") || origin.startsWith("chrome-extension://");
}

function send(res, status, body, origin) {
  res.writeHead(status, {
    "content-type": "application/json",
    ...(origin ? { "access-control-allow-origin": origin, vary: "origin" } : {}),
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error("capture too large"), { status: 413 });
    chunks.push(chunk);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

async function handle(req, res) {
  const origin = req.headers.origin;
  if (!allowed(req)) return send(res, 403, { error: "only the recorder extension may call this" });
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST",
      "access-control-allow-headers": "content-type, x-nfh-recorder",
      "access-control-max-age": "600",
    });
    return res.end();
  }
  const { pathname, searchParams } = new URL(req.url, "http://127.0.0.1");
  try {
    if (req.method === "GET" && pathname === "/api/status") {
      return send(res, 200, {
        ok: true,
        fixturesDir: fixturesDir(),
        isRepo: existsSync(join(fixturesDir(), ".git")),
        fixtures: listFixtures().length,
        wantedOpen: readWanted().filter((w) => w.status !== "done").length,
      }, origin);
    }
    if (req.method === "GET" && pathname === "/api/coverage") {
      const url = searchParams.get("url");
      if (!url) return send(res, 400, { error: "url required" }, origin);
      return send(res, 200, coverage(url), origin);
    }
    if (req.method === "GET" && pathname === "/api/fixtures") {
      return send(res, 200, { fixtures: listFixtures().map((m) => summary(m)) }, origin);
    }
    if (req.method === "GET" && pathname === "/api/wanted") {
      return send(res, 200, { wanted: readWanted() }, origin);
    }
    if (req.method === "GET" && pathname === "/api/contracts") {
      return send(res, 200, { contracts: readContracts() }, origin);
    }
    if (req.method === "POST" && pathname === "/api/css/missing") {
      const { hrefs = [] } = await readBody(req);
      return send(res, 200, { missing: hrefs.filter((h) => typeof h === "string" && !hasCss(h)) }, origin);
    }
    if (req.method === "POST" && pathname === "/api/capture") {
      const capture = await readBody(req);
      const { meta, step } = writeCapture(capture);
      const kb = Math.round(Buffer.byteLength(capture.step.html) / 1024);
      console.log(
        `[recorder] ${meta.id} step ${step.n} (${step.label || step.trigger}, ${step.theme}, ${step.layout?.name}) ` +
          `${kb} KB, ${step.network?.length || 0} responses${step.screenshot ? ", screenshot" : ""}` +
          `${capture.css ? `, ${Object.keys(capture.css).length} stylesheets` : ""}`,
      );
      return send(res, 200, { ok: true, id: meta.id, step: step.n, steps: meta.steps.length }, origin);
    }
    return send(res, 404, { error: "not found" }, origin);
  } catch (error) {
    console.error(`[recorder] ${req.method} ${pathname}: ${error.message}`);
    return send(res, error.status || 400, { error: error.message }, origin);
  }
}

export function startServer({ port = DEFAULT_PORT, quiet = false } = {}) {
  const server = createServer((req, res) => {
    handle(req, res).catch((error) => send(res, 500, { error: error.message }));
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      if (!quiet) {
        console.log(`[recorder] listening on http://127.0.0.1:${server.address().port}`);
        console.log(`[recorder] fixtures: ${fixturesDir()}`);
      }
      resolve(server);
    });
  });
}

const isMain = (p) => p && resolve(p).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (isMain(process.argv[1])) {
  await startServer({ port: Number(process.env.NFH_RECORDER_PORT) || DEFAULT_PORT });
}
