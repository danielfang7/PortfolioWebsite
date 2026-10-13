// Value: protects=vitest workers start on every Node, so a wrong runtime reaches
// node-version.test.ts and its clear message; fails_when=vitest.config.ts passes a
// flag the running Node rejects (workers die with EPIPE and no test runs);
// why_new=--no-experimental-webstorage only exists from Node 22.4; seam=none;
// no_claim=that the flag has the intended effect (museum-hydration covers storage).

import { expect, it } from "vitest";
import { supportedNodeFlags } from "./support/node-flags";

it("keeps a flag the runtime accepts", () => {
  expect(supportedNodeFlags(["--no-experimental-webstorage"], new Set(["--no-experimental-webstorage"]))).toEqual([
    "--no-experimental-webstorage",
  ]);
});

it("drops a flag the runtime does not know", () => {
  expect(supportedNodeFlags(["--no-experimental-webstorage"], new Set())).toEqual([]);
});

it("reads the running Node's allowed flags by default", () => {
  // .nvmrc pins Node 24, which knows the webstorage flag.
  expect(supportedNodeFlags(["--no-experimental-webstorage", "--not-a-real-flag"])).toEqual([
    "--no-experimental-webstorage",
  ]);
});
