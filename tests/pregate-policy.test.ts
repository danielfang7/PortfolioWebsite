// Value: protects=gstack's pre-ship check runs the right tests from .gstack/pregate.json;
// fails_when=a test is renamed or added without updating the policy, so a declared
// lane points at a missing file or a shared list skips a test (the check then passes
// as "no lane needed" without running it); why_new=gstack validates only path shape,
// never that a listed test exists; seam=none (reads the policy file); no_claim=that
// each source path maps to the right tests (review owns that).

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// A change to any of these reaches every test, so each lists the whole suite.
const SHARED = ["package.json", "package-lock.json", "vitest.config.ts", ".nvmrc", "tests/support/**"];

// Read inside each test, so a skipped run never touches the file.
function policy() {
  const deps: Record<string, string[]> = JSON.parse(readFileSync(".gstack/pregate.json", "utf8")).dependencies;
  const tests = (readdirSync("tests", { recursive: true }) as string[])
    .filter((f) => /\.test\.tsx?$/.test(f))
    .map((f) => `tests/${f}`)
    .sort();
  return { deps, tests };
}

// The policy is tooling for gstack's pre-ship check, so it should never block a site
// deploy. Netlify sets NETLIFY=true; GitHub Actions still runs this on every PR.
describe.skipIf(process.env.NETLIFY === "true")(".gstack/pregate.json", () => {
  it("names only test files that exist", () => {
    const { deps, tests } = policy();
    const listed = [...new Set(Object.values(deps).flat())];
    expect(listed.filter((t) => !tests.includes(t))).toEqual([]);
  });

  it.each(SHARED)("%s selects every test", (key) => {
    const { deps, tests } = policy();
    expect([...(deps[key] ?? [])].sort()).toEqual(tests);
  });
});
