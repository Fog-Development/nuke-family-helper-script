// Build script: bundles src/ into the single userscript file that users
// install (nuke-family-helper.user.js at the repo root). The userscript
// metadata header is generated from src/header.txt with the version taken
// from package.json, so the version only ever needs to be bumped in one place.
//
// Usage:
//   npm run build         production build (debug off)
//   npm run watch         rebuild on change (debug off)
//   npm run watch:debug   rebuild on change with debug on (nuke.test API + logging)
//
// IMPORTANT: always run `npm run build` (not watch:debug) before committing —
// the committed nuke-family-helper.user.js is what users install and what the
// update checker downloads. CI verifies the committed file matches a fresh
// production build.
import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";

const watch = process.argv.includes("--watch");
const debug = process.argv.includes("--debug");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const header = readFileSync("src/header.txt", "utf8").replace(
  /\{\{VERSION\}\}/g,
  pkg.version,
);

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  target: "es2020",
  outfile: "nuke-family-helper.user.js",
  banner: { js: header },
  loader: { ".css": "text" },
  define: {
    __DEBUG__: JSON.stringify(debug),
    __VERSION__: JSON.stringify(pkg.version),
  },
  // Keep the output readable: it gets committed and reviewed in PRs, and some
  // users will read it before installing.
  minify: false,
  legalComments: "none",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log(
    `Watching for changes (debug=${debug})... output: ${options.outfile}`,
  );
} else {
  await esbuild.build(options);
  console.log(`Built ${options.outfile} v${pkg.version} (debug=${debug})`);
}
