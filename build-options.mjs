// Shared esbuild options, used by build.mjs (the real build) and by the test
// harness (test/harness), so tests always run against the same bundling
// configuration that ships to users.
import { readFileSync } from "node:fs";

// A Windows checkout (git's autocrlf) has CRLF line endings; CI and the
// committed file have LF. Text that goes into the bundle as it is (the CSS and
// the header) is read with LF so every machine builds the same bytes.
const readLf = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const cssAsLfText = {
  name: "css-as-lf-text",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, (args) => ({ contents: readLf(args.path), loader: "text" }));
  },
};

export function makeBuildOptions({
  debug = false,
  outfile = "nuke-family-helper.user.js",
} = {}) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const header = readLf("src/header.txt").replace(
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
    plugins: [cssAsLfText],
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
