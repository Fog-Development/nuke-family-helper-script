// Maintains test/fixtures/torn-css/: Torn's own stylesheets as referenced by the
// page fixtures. These ARE committed, so tests never touch the network and keep
// working even after Torn retires an old build's files. The harness serves them
// when a fixture asks for them, so pages render with Torn's real styling, light
// and dark.
//
//   npm run fixtures:css            download any referenced stylesheet that is
//                                   missing, and delete ones no fixture uses
//                                   (run after adding or re-capturing a fixture)
//   npm run fixtures:css:refresh    re-download everything (run when you want the
//                                   CSS to reflect Torn's current styling; review
//                                   the git diff afterwards)
//
// Most files are content-hashed (/builds/...) or versioned (?v=...), so an
// existing download rarely changes; --refresh also catches in-place edits.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const PAGES = fileURLToPath(new URL("../fixtures/pages/", import.meta.url));
const OUT = fileURLToPath(new URL("../fixtures/torn-css/", import.meta.url));
mkdirSync(OUT, { recursive: true });

export const cssFileName = (pathAndQuery) => encodeURIComponent(pathAndQuery);

const hrefs = new Set();
for (const file of readdirSync(PAGES).filter((f) => f.endsWith(".html"))) {
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
