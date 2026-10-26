// Build script: bundles src/ into the single userscript file that users
// install (nuke-family-helper.user.js at the repo root). The userscript
// metadata header is generated from src/header.txt with the version taken
// from package.json, so the version only ever needs to be bumped in one place.
//
// Usage:
//   npm run build              production build -> nuke-family-helper.user.js
//   npm run watch              the same, rebuilt on change
//   npm run build:dev          dev build (logging, nuke.family) -> nuke-family-helper.dev.user.js
//   npm run watch:debug        the same, rebuilt on change
//   npm run watch:debug-site   dev build against the local nuke.test, rebuilt on change
//
// Debug builds never touch nuke-family-helper.user.js, the file users install
// and the update checker downloads; CI verifies it matches a fresh production
// build. The dev file is gitignored.
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
