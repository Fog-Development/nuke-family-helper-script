// What is in the fixture store, for people and for Claude.
//
//   npm run fixtures                 every fixture: id, steps, themes, widths, age, URL
//   npm run fixtures -- show <id>    one fixture's meta.json, steps and actions
//   npm run fixtures -- wanted       captures asked for and not done yet
import { fixturesDir, hasFixtures, listFixtures, MISSING_FIXTURES_HELP, readMeta, readWanted } from "./store.mjs";

const [command = "list", arg] = process.argv.slice(2);
if (!hasFixtures()) {
  console.error(MISSING_FIXTURES_HELP);
  process.exit(1);
}
const day = (iso) => (iso ? iso.slice(0, 10) : "?");

if (command === "list") {
  console.log(`Fixtures in ${fixturesDir()}\n`);
  for (const m of listFixtures()) {
    const themes = [...new Set(m.steps.map((s) => s.theme))].join("/");
    const layouts = [...new Set(m.steps.map((s) => s.layout?.name).filter(Boolean))].join("/");
    console.log(
      `${m.id.padEnd(36)} ${String(m.steps.length).padStart(2)} step(s)  ${themes.padEnd(10)} ${layouts.padEnd(8)} ${day(m.updatedAt)}  ${m.source}`,
    );
    console.log(`${"".padEnd(36)} ${m.url}`);
  }
  const open = readWanted().filter((w) => w.status !== "done").length;
  if (open) console.log(`\n${open} wanted capture(s) open: npm run fixtures -- wanted`);
} else if (command === "show") {
  const m = readMeta(arg);
  console.log(`${m.id}: ${m.title}\n${m.url}\n${m.notes || ""}\n`);
  for (const s of m.steps) {
    console.log(`step ${s.n} ${s.file}  ${s.label || s.trigger}  ${s.theme} ${s.layout?.name || ""} ${day(s.capturedAt)}`);
    console.log(`  ${s.url}`);
    for (const a of s.actions || []) console.log(`  - ${a.type} ${a.selector || a.url || ""} ${a.text ? JSON.stringify(a.text) : ""}`);
    if (s.changedRoot) console.log(`  changed: ${s.changedRoot}`);
    if (s.network?.length) console.log(`  network: ${s.network.join(", ")}`);
    if (s.screenshot) console.log(`  screenshot: ${s.screenshot}`);
  }
} else if (command === "wanted") {
  for (const w of readWanted().filter((w) => w.status !== "done")) {
    console.log(`${w.id}  (${w.theme || "any theme"}${w.layout ? `, ${w.layout}` : ""}${w.scenario ? ", scenario" : ""})`);
    console.log(`  ${w.url}\n  ${w.instructions}\n`);
  }
} else {
  console.error("usage: npm run fixtures [-- list | show <id> | wanted]");
  process.exit(2);
}
