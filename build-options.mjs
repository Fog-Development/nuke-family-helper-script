// Shared esbuild options, used by build.mjs (the real build) and by the test
// harness (test/harness), so tests always run against the same bundling
// configuration that ships to users.
import { readFileSync } from "node:fs";

export function makeBuildOptions({
  debug = false,
  outfile = "nuke-family-helper.user.js",
} = {}) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const header = readFileSync("src/header.txt", "utf8").replace(
    /\{\{VERSION\}\}/g,
    pkg.version,
  );

  /** @type {import("esbuild").BuildOptions} */
  return {
    entryPoints: ["src/main.js"],
    bundle: true,
    format: "iife",
    target: "es2020",
    outfile,
    banner: { js: header },
    loader: { ".css": "text" },
    define: {
      __DEBUG__: JSON.stringify(debug),
      __VERSION__: JSON.stringify(pkg.version),
    },
    // Keep the output readable: it gets committed and reviewed in PRs, and
    // some users will read it before installing.
    minify: false,
    legalComments: "none",
  };
}
