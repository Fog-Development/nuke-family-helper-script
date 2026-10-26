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

// The file users install. Only a production build is ever written here.
export const RELEASE_FILE = "nuke-family-helper.user.js";
// Debug builds go to their own file (gitignored), named "Nuke Assistant (dev)"
// so it can be installed beside the real one and pasted into a userscript
// manager that cannot load files from disk (Firefox).
export const DEV_FILE = "nuke-family-helper.dev.user.js";

export function makeBuildOptions({
  debug = false,
  debugSite = false,
  outfile = debug || debugSite ? DEV_FILE : RELEASE_FILE,
} = {}) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  let header = readLf("src/header.txt").replace(
    /\{\{VERSION\}\}/g,
    pkg.version,
  );
  if (debug || debugSite) {
    header = header.replace(/^(\/\/ @name\s+)(.+)$/m, `$1$2 (dev${debugSite ? ", nuke.test" : ""})`);
  }

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
      __DEBUG__: JSON.stringify(debug || debugSite),
      __DEBUG_SITE__: JSON.stringify(debugSite),
      __VERSION__: JSON.stringify(pkg.version),
    },
    // Keep the output readable: it gets committed and reviewed in PRs, and
    // some users will read it before installing.
    minify: false,
    legalComments: "none",
  };
}
