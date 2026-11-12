// Fallback for fixtures/torn-css/ (Torn's stylesheets, kept in the private
// fixtures repository with the pages). The recorder extension saves each
// stylesheet from the page itself when it captures, so this is only needed for
// a page saved some other way, or to bring the CSS up to Torn's current styling.
//
//   npm run fixtures:css            download any referenced stylesheet that is
//                                   missing, and delete ones no fixture uses
//   npm run fixtures:css:refresh    re-download everything (review the diff in
//                                   the fixtures repository afterwards)
//
// These are Torn's static stylesheet files, not pages. Most are content-hashed
// (/builds/...) or versioned (?v=...), so an existing file rarely changes.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cssDir, cssFileName, hasFixtures, MISSING_FIXTURES_HELP, pagesDir } from "../../tools/fixture-recorder/store.mjs";

if (!hasFixtures()) {
  console.error(MISSING_FIXTURES_HELP);
  process.exit(1);
}
const PAGES = pagesDir();
const OUT = cssDir();
mkdirSync(OUT, { recursive: true });

const hrefs = new Set();
const htmlFiles = readdirSync(PAGES, { recursive: true }).map(String).filter((f) => f.endsWith(".html"));
for (const file of htmlFiles) {
  const html = readFileSync(join(PAGES, file), "utf8");
  for (const m of html.matchAll(/<link[^>]+href="(\/[^"]+\.css[^"]*)"/g)) {
    hrefs.add(m[1].replaceAll("&amp;", "&"));
  }
}

const refresh = process.argv.includes("--refresh");
const todo = [...hrefs].filter((h) => refresh || !existsSync(join(OUT, cssFileName(h))));
console.log(`${hrefs.size} stylesheets referenced, ${todo.length} to download`);

let failed = 0;
const queue = [...todo];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const href = queue.pop();
      try {
        const res = await fetch(`https://www.torn.com${href}`, {
          headers: { "User-Agent": "Mozilla/5.0 (nuke-family-helper test fixtures)" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        writeFileSync(join(OUT, cssFileName(href)), Buffer.from(await res.arrayBuffer()));
      } catch (error) {
        failed++;
        console.error(`failed ${href}: ${error.message}`);
      }
    }
  }),
);
// Drop files no fixture references any more (only when everything needed is
// present, so a failed download never deletes a working file).
if (!failed) {
  const wanted = new Set([...hrefs].map(cssFileName));
  for (const file of readdirSync(OUT)) {
    if (!wanted.has(file)) {
      unlinkSync(join(OUT, file));
      console.log(`removed unreferenced ${decodeURIComponent(file)}`);
    }
  }
}
console.log(failed ? `${failed} failed` : "done");
process.exit(failed ? 1 : 0);
