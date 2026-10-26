// Build script: bundles src/ into the single userscript file that users
// install (nuke-family-helper.user.js at the repo root). The userscript
// metadata header is generated from src/header.txt with the version taken
// from package.json, so the version only ever needs to be bumped in one place.
//
// Usage:
//   npm run build         production build (debug off)
//   npm run watch         rebuild on change (debug off)
//   npm run watch:debug        rebuild on change with logging, against nuke.family
//   npm run watch:debug-site   rebuild on change with logging, against nuke.test
//
// IMPORTANT: always run `npm run build` (not watch:debug) before committing —
// the committed nuke-family-helper.user.js is what users install and what the
// update checker downloads. CI verifies the committed file matches a fresh
// production build.
import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { makeBuildOptions } from "./build-options.mjs";

const watch = process.argv.includes("--watch");
const debug = process.argv.includes("--debug");
// Implies --debug: logging, and the local nuke.test site instead of nuke.family.
const debugSite = process.argv.includes("--debug-site");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const options = makeBuildOptions({ debug, debugSite });

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log(
    `Watching for changes (debug=${debug || debugSite}, site=${debugSite ? "nuke.test" : "nuke.family"})... output: ${options.outfile}`,
  );
} else {
  await esbuild.build(options);
  console.log(`Built ${options.outfile} v${pkg.version} (debug=${debug || debugSite}, site=${debugSite ? "nuke.test" : "nuke.family"})`);
}
