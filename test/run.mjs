// Test runner: finds every *.test.mjs under test/ and runs them with the
// built-in node:test runner. Used instead of `node --test "<glob>"` because
// glob arguments need Node 21+ (and unquoted globs depend on the shell, which
// differs on Windows). Extra arguments filter by substring of the file path:
//   npm test -- hospital
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative, sep } from "node:path";
import { hasFixtures, MISSING_FIXTURES_HELP } from "../tools/fixture-recorder/store.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const testDir = fileURLToPath(new URL("./", import.meta.url));
const filters = process.argv.slice(2);

let files = readdirSync(testDir, { recursive: true })
  .map(String)
  .filter((f) => f.endsWith(".test.mjs"))
  .map((f) => relative(root, join(testDir, f)))
  .filter((f) => filters.every((term) => f.includes(term)))
  .sort();

// The page tests need the private fixtures repository (test/README.md). Without
// it the rest still runs, unless NFH_REQUIRE_FIXTURES says it must be there (CI
// sets it whenever it can check the fixtures out).
if (!hasFixtures()) {
  if (process.env.NFH_REQUIRE_FIXTURES) {
    console.error(MISSING_FIXTURES_HELP);
    process.exit(1);
  }
  const pageTests = files.filter((f) => f.split(sep).join("/").startsWith("test/features/"));
  if (pageTests.length) {
    console.warn(`Skipping ${pageTests.length} page test file(s). ${MISSING_FIXTURES_HELP}\n`);
    files = files.filter((f) => !pageTests.includes(f));
  }
}

if (!files.length) {
  console.error(`No test files match ${JSON.stringify(filters)}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  cwd: root,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
