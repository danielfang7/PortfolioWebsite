// Value: protects=tests and builds run on the Node major pinned in .nvmrc;
// fails_when=Netlify (where a NODE_VERSION set in the site's UI overrides .nvmrc),
// CI or a local shell runs a different major; why_new=the runtime pin moved from
// netlify.toml to .nvmrc and a stale UI setting would otherwise build production on
// another Node silently; seam=none; no_claim=minor or patch versions.

import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("runs on the Node major pinned in .nvmrc", () => {
  const pinned = readFileSync(".nvmrc", "utf8").trim();
  expect(process.versions.node.split(".")[0], `.nvmrc pins Node ${pinned}`).toBe(pinned);
});
