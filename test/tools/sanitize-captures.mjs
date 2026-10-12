// Turns raw Torn page captures (document.documentElement.outerHTML copied from
// DevTools) into committable test fixtures.
//
//   node test/tools/sanitize-captures.mjs <raw-dir> [--themes dark|light|both]
//                                         [--out <dir>] [--deny "str1,str2"]
//
// Raw files must be named <fixture>-<light|dark>.html. By default only the
// dark capture of each page is written (the harness toggles the theme class),
// to test/fixtures/pages/<fixture>.html.
//
// What it does:
//   * removes scripts, iframes, extension (TornTools) injections, websocket /
//     sentry / session data and anything else that identifies the account;
//   * replaces player names, player IDs, faction names/IDs, money amounts and
//     external images with consistent fake values (the same real player gets
//     the same fake identity on every page);
//   * leak-checks the result against every real name/ID it replaced, plus
//     secret-looking patterns and any --deny strings, and exits non-zero (and
//     writes nothing for that file) if anything survives.
//
// The real->fake map is saved to <raw-dir>/sanitize-map.json (NEVER commit it)
// so re-runs stay stable. Put extra strings that must never appear (your real
// name, etc.) one per line in <raw-dir>/deny.txt.
import { chromium } from "playwright";
import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const args = process.argv.slice(2);
const rawDir = resolve(args.find((a) => !a.startsWith("--")) ?? "");
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const themes = opt("themes", "dark");
const outDir = resolve(opt("out", "test/fixtures/pages"));
const denyArg = (opt("deny", "") || "").split(",").filter(Boolean);

if (!rawDir || !existsSync(rawDir)) {
  console.error("usage: sanitize-captures.mjs <raw-dir> [--themes dark|light|both] [--out dir] [--deny a,b]");
  process.exit(2);
}

const MAP_PATH = join(rawDir, "sanitize-map.json");
const map = existsSync(MAP_PATH)
  ? JSON.parse(readFileSync(MAP_PATH, "utf8"))
  : { players: {}, factions: {}, names: {}, factionNames: {} };

const files = readdirSync(rawDir)
  .filter((f) => /-(light|dark)\.html$/.test(f))
  .filter((f) => themes === "both" || f.endsWith(`-${themes}.html`));

const NOT_NAMES = new Set([
  "View", "Profile", "Attack", "Mug", "Send", "Message", "Trade", "Bounty", "Report",
  "Friend", "Enemy", "Revive", "Hospitalize", "Details", "Faction", "Online", "Offline",
  "Idle", "Okay", "Spouse", "Mother", "Father", "Partner", "Hospital", "Traveling", "Abroad", "Jail", "Federal", "Join", "Leave",
]);
// Faction "names" that are really placeholders for no faction.
const NOT_FACTION_NAMES = new Set(["N/A", "None", "-", "—"]);
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#888"/></svg>',
  );

function stripScripts(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, "");
}

// ---- in-page functions (run inside the browser) ---------------------------

function collectInPage(notNames) {
  const found = { pairs: [], anchors: [], factionAnchors: [], user: null, subject: null };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const re = /([\w-]{2,20}) \[(\d{3,9})\]/g;
  const scan = (text) => {
    for (const m of text.matchAll(re)) found.pairs.push([m[2], m[1]]);
  };
  for (let n = walker.nextNode(); n; n = walker.nextNode()) scan(n.nodeValue);
  document.querySelectorAll("[title],[alt],[aria-label]").forEach((el) => {
    for (const a of ["title", "alt", "aria-label"]) {
      const v = el.getAttribute(a);
      if (v) scan(v);
    }
  });
  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    const text = a.textContent.trim();
    const p = href.match(/profiles\.php\?XID=(\d+)/);
    if (p && /^[\w-]{3,20}$/.test(text) && !notNames.includes(text)) {
      found.anchors.push([p[1], text]);
    }
    const f = href.match(/factions\.php\?step=profile&(?:amp;)?ID=(\d+)/);
    if (f && text.length >= 3 && text.length <= 40) found.factionAnchors.push([f[1], text]);
  });
  const tu = document.querySelector("input#torn-user");
  if (tu) {
    try {
      const j = JSON.parse(tu.getAttribute("value"));
      found.user = [j.id, j.playername];
    } catch (e) {}
  }
  // The viewed player on a profile page and their faction link.
  const h = document.querySelector("h4, h1");
  const subj = [...document.querySelectorAll("h4")]
    .map((e) => e.textContent.match(/([\w-]{2,20}) \[(\d{3,9})\]/))
    .find(Boolean);
  if (subj) found.subject = [subj[2], subj[1]];
  const fa = document.querySelector(
    ".basic-information .info-table a[href*='factions.php?step=profile&ID=']",
  );
  if (fa) found.subjectFaction = fa.getAttribute("href").match(/ID=(\d+)/)[1];
  return found;
}

function scrubInPage({ playerIds, factionIds, names, factionNames, placeholder }) {
  // ---- removals
  const kill = (sel) => document.querySelectorAll(sel).forEach((e) => e.remove());
  kill("script, noscript, iframe, #websocketConnectionData, #torn-server-time, input#torn-user");
  kill("style#googleidentityservice_button_styles, [id^=g_id], [id^=credential_picker]");
  kill("meta[name=sentry-trace], meta[name=baggage], link[href^='moz-extension'], link[href^='chrome-extension']");
  kill("[id^=chat_panel_button], svg.tt-svg, .tt-container, .tt-sidebar-information, .tt-sidebar-information-divider, [id^=tt-]");
  document.querySelectorAll("textarea").forEach((t) => (t.textContent = ""));
  document.documentElement.removeAttribute("style");
  document.body.removeAttribute("style");

  const digitsToFake = (digits) => {
    let h = 2166136261;
    for (const c of digits) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    const rnd = () => ((h = (Math.imul(h, 1664525) + 1013904223) >>> 0) / 4294967296);
    return [...digits]
      .map((_, i) => String(i === 0 ? 1 + Math.floor(rnd() * 9) : Math.floor(rnd() * 10)))
      .join("");
  };
  const fakeMoney = (m) => {
    const digits = m.replace(/[^\d]/g, "");
    if (/^0+$/.test(digits)) return m;
    const fake = digitsToFake(digits);
    // Preserve thousands separators if the original had them.
    return m.includes(",") ? fake.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : fake;
  };

  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameEntries = Object.entries({ ...names, ...factionNames }).sort(
    (a, b) => b[0].length - a[0].length,
  );
  const nameRe = nameEntries.length
    ? new RegExp(`(?<![\\w-])(${nameEntries.map(([n]) => escapeRe(n)).join("|")})(?![\\w-])`, "g")
    : null;
  const nameLookup = Object.fromEntries(nameEntries);
  const idEntries = { ...playerIds, ...factionIds };
  // Long IDs are unambiguous anywhere; short ones (< 5 digits) could collide
  // with ordinary numbers, so they are only replaced in ID=... URL contexts.
  const longIds = Object.keys(idEntries).filter((i) => i.length >= 5);
  const shortIds = Object.keys(idEntries).filter((i) => i.length < 5);
  const idRe = longIds.length
    ? new RegExp(`(?<!\\d)(${longIds.map(escapeRe).join("|")})(?!\\d)`, "g")
    : null;
  const shortIdRe = shortIds.length
    ? new RegExp(`(ID=)(${shortIds.map(escapeRe).join("|")})(?!\\d)`, "g")
    : null;

  const scrub = (s) => {
    if (!s) return s;
    if (nameRe) s = s.replace(nameRe, (m) => nameLookup[m]);
    if (idRe) s = s.replace(idRe, (m) => idEntries[m]);
    if (shortIdRe) s = s.replace(shortIdRe, (m, p, id) => p + idEntries[id]);
    s = s.replace(/\b[0-9a-f]{32}\b/g, "0".repeat(32));
    s = s.replace(/\$\d[\d,]*/g, (m) => "$" + fakeMoney(m.slice(1)));
    return s;
  };

  const skipAttr = new Set(["class", "style", "d", "viewBox", "points", "transform"]);
  const all = [document.documentElement, ...document.querySelectorAll("*")];
  for (const el of all) {
    for (const attr of [...el.attributes]) {
      const n = attr.name;
      if (n.startsWith("on")) { el.removeAttribute(n); continue; }
      if (n.startsWith("data-tt-")) { el.removeAttribute(n); continue; }
      if (n === "data-money") { el.setAttribute(n, fakeMoney(attr.value)); continue; }
      if (n === "src" || n === "srcset") {
        if (/^(https?:)?\/\//.test(attr.value) && !/^(https?:)?\/\/(www\.)?torn\.com\//.test(attr.value)) {
          if (n === "srcset") el.removeAttribute(n);
          else el.setAttribute("src", placeholder);
          continue;
        }
      }
      if (n === "style") {
        const v = attr.value.replace(/url\((['"]?)https?:[^)]*\1\)/g, "none");
        el.setAttribute(n, scrub(v));
        continue;
      }
      if (!skipAttr.has(n)) el.setAttribute(n, scrub(attr.value));
    }
    const cls = el.getAttribute("class");
    if (cls && /(^|\s)tt-/.test(cls)) {
      el.setAttribute("class", cls.split(/\s+/).filter((c) => !c.startsWith("tt-")).join(" "));
    }
  }
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  for (const n of nodes) {
    if (n.parentElement && n.parentElement.tagName === "STYLE") continue;
    n.nodeValue = scrub(n.nodeValue);
  }
  const charset = document.querySelector("meta[charset]");
  if (charset) charset.setAttribute("charset", "utf-8");
  return document.documentElement.outerHTML;
}

// ---- mapping --------------------------------------------------------------

let nextPlayer = 100000;
let nextFaction = 9100;
for (const id of Object.values(map.players)) nextPlayer = Math.max(nextPlayer, Number(id) + 1);
for (const id of Object.values(map.factions)) nextFaction = Math.max(nextFaction, Number(id) + 1);

function mapPlayer(id, name) {
  if (Number(id) < 1000) return; // NPCs and staff keep their identity
  if (!(id in map.players)) map.players[id] = String(nextPlayer++);
  if (name && !(name in map.names)) map.names[name] = `Member${map.players[id]}`;
}
function mapFaction(id, name) {
  if (name && NOT_FACTION_NAMES.has(name)) name = null;
  if (!(id in map.factions)) map.factions[id] = String(nextFaction++);
  if (name && !(name in map.factionNames)) map.factionNames[name] = `Faction ${map.factions[id]}`;
}

// ---- run ------------------------------------------------------------------

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.route("**/*", (r) => r.abort());

async function load(file) {
  const html = stripScripts(readFileSync(join(rawDir, file), "utf8"));
  await page.setContent(html, { waitUntil: "domcontentloaded" });
}

// Pass 1: learn identities across ALL files so each fake identity is global.
for (const file of files) {
  await load(file);
  const found = await page.evaluate(collectInPage, [...NOT_NAMES]);
  if (found.user) {
    map.players[found.user[0]] = "1";
    map.names[found.user[1]] = "TestUser";
  }
  if (file.startsWith("profiles-") && found.subject) {
    map.players[found.subject[0]] = "1234";
    map.names[found.subject[1]] = "TestPlayer";
    if (found.subjectFaction) {
      map.factions[found.subjectFaction] = "5678";
      map.factionNames["__subject__"] = "Test Faction";
    }
  }
}
for (const file of files) {
  await load(file);
  const found = await page.evaluate(collectInPage, [...NOT_NAMES]);
  for (const [id, name] of [...found.pairs, ...found.anchors]) mapPlayer(id, name);
  for (const [id, name] of found.factionAnchors) mapFaction(id, name);
}
// Faction-name fixups: the subject faction's real name gets the fixed fake.
{
  const profileFile = files.find((f) => f.startsWith("profiles-"));
  if (profileFile) {
    await load(profileFile);
    const found = await page.evaluate(collectInPage, [...NOT_NAMES]);
    const subjFaction = found.subjectFaction;
    for (const [id, name] of found.factionAnchors) {
      if (id === subjFaction) map.factionNames[name] = "Test Faction";
    }
  }
  delete map.factionNames["__subject__"];
}
writeFileSync(MAP_PATH, JSON.stringify(map, null, 2));

console.log("Identities found (review these - names that are not player names need adding to NOT_NAMES):");
console.log("  player names:", Object.keys(map.names).join(", "));
console.log("  faction names:", Object.keys(map.factionNames).join(", "));

// Leak patterns that must never survive, whatever the maps say.
const SECRET_PATTERNS = [
  [/eyJ[\w-]{10,}/, "JWT"],
  [/moz-extension|chrome-extension/, "extension url"],
  [/logoutHash|csrf|rfc_v/i, "session token field"],
  [/\b(?!0{32}\b)[0-9a-f]{32}\b/, "32-char hash"],
  [/sentry-trace|baggage/, "sentry"],
  [/avatars\.torn\.com|profileimages\.torn\.com|i\.ibb\.co|fog-dev\.com/, "external user image/host"],
  [/\btt-[\w-]+/, "TornTools artefact"],
];
const denyFile = join(rawDir, "deny.txt");
const deny = [
  ...denyArg,
  ...(existsSync(denyFile) ? readFileSync(denyFile, "utf8").split("\n").map((s) => s.trim()).filter(Boolean) : []),
];

mkdirSync(outDir, { recursive: true });
let failed = false;
for (const file of files) {
  await load(file);
  const body = await page.evaluate(scrubInPage, {
    playerIds: Object.fromEntries(Object.entries(map.players).filter(([id]) => Number(id) >= 1000)),
    factionIds: map.factions,
    names: map.names,
    factionNames: Object.fromEntries(
      Object.entries(map.factionNames).filter(([n]) => n.length >= 3 && !/^\d+$/.test(n)),
    ),
    placeholder: PLACEHOLDER_IMG,
  });
  const out =
    "<!DOCTYPE html>\n<!-- SANITIZED Torn page capture. Names, IDs, amounts and images are fake; " +
    "scripts removed. Generated by test/tools/sanitize-captures.mjs - do not hand-edit. -->\n" +
    body +
    "\n";

  const problems = [];
  const ctx = (re) => {
    if (!args.includes("--debug")) return;
    const m = out.match(re);
    if (m) console.error(`   [${file}] ${re}: ...${out.slice(Math.max(0, m.index - 80), m.index + m[0].length + 60).replace(/\n/g, " ")}...`);
  };
  for (const id of Object.keys(map.players)) {
    if (Number(id) >= 1000 && new RegExp(`(?<!\\d)${id}(?!\\d)`).test(out)) { problems.push(`real player id ${id}`); ctx(new RegExp(`(?<!\\d)${id}(?!\\d)`)); }
  }
  for (const id of Object.keys(map.factions)) {
    const re = id.length >= 5 ? new RegExp(`(?<!\\d)${id}(?!\\d)`) : new RegExp(`ID=${id}(?!\\d)`);
    if (re.test(out)) { problems.push(`real faction id ${id}`); ctx(re); }
  }
  for (const n of [...Object.keys(map.names), ...Object.keys(map.factionNames), ...deny]) {
    if (n.length < 3 || /^\d+$/.test(n)) continue; // numeric tags collide with amounts
    const re = new RegExp(`(?<![\\w-])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`);
    if (re.test(out)) { problems.push(`real name/deny string "${n}"`); ctx(re); }
  }
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(out)) { problems.push(label); ctx(re); }
  }

  const fixture = basename(file).replace(/-(light|dark)\.html$/, "");
  const suffix = themes === "both" ? `-${/-light\./.test(file) ? "light" : "dark"}` : "";
  if (problems.length) {
    failed = true;
    console.error(`LEAK ${file}: ${[...new Set(problems)].join("; ")}  (not written)`);
    continue;
  }
  writeFileSync(join(outDir, `${fixture}${suffix}.html`), out);
  console.log(`wrote ${fixture}${suffix}.html (${(out.length / 1024).toFixed(0)} KB)`);
}
await browser.close();
process.exit(failed ? 1 : 0);
