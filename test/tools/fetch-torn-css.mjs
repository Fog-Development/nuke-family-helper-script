// Downloads the Torn stylesheets referenced by the page fixtures into
// test/fixtures/torn-css/ (gitignored: it is Torn's own CSS, so it is fetched
// rather than committed). The harness serves these files when a fixture asks
// for them, so fixtures render with Torn's real styling, light and dark.
//
//   npm run fixtures:css
//
// Files are content-hashed (/builds/...) or versioned (?v=...), so an existing
// download never needs refreshing; re-run after capturing new fixtures.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

const todo = [...hrefs].filter((h) => !existsSync(join(OUT, cssFileName(h))));
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
console.log(failed ? `${failed} failed` : "done");
process.exit(failed ? 1 : 0);
