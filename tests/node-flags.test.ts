// Value: protects=supportedNodeFlags keeps exactly the flags the allowed set lists;
// fails_when=it keeps a flag the set lacks, drops one it has, or stops defaulting to
// process.allowedNodeEnvironmentFlags; why_new=--no-experimental-webstorage only
// exists from Node 22.4, and passing it unfiltered kills every worker; seam=none;
// no_claim=that the flag has the intended effect (museum-hydration covers storage).

import { expect, it, vi } from "vitest";
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

// Value: protects=vitest.config.ts hands workers only the flags the running Node
// knows, and the pinned Node drops none of them; fails_when=execArgv goes back to a
// literal array, or a flag in the config is misspelled or renamed so the pinned Node
// drops it silently; why_new=the tests above check the helper alone, and on Node 24
// the filtered and literal arrays are identical; seam=none; no_claim=that workers
// start on a real pre-22.4 Node, or that Astro's merge keeps poolOptions
// (getViteConfig is mocked to identity and Node's flag set is stubbed).
it("vitest.config.ts passes workers only the flags the running Node knows", async () => {
  const listed = await workerFlags({ has: () => true } as unknown as ReadonlySet<string>);
  expect(listed.length, "the config asks for at least one worker flag").toBeGreaterThan(0);
  expect(await workerFlags(), "the pinned Node knows every flag the config asks for").toEqual(listed);
  expect(await workerFlags(new Set()), "a Node that knows none of them gets none").toEqual([]);
});

/** Evaluates vitest.config.ts against `allowed` (default: this Node's real flags). */
async function workerFlags(allowed?: ReadonlySet<string>): Promise<string[]> {
  const real = Object.getOwnPropertyDescriptor(process, "allowedNodeEnvironmentFlags")!;
  if (allowed) Object.defineProperty(process, "allowedNodeEnvironmentFlags", { value: allowed, configurable: true });
  try {
    vi.resetModules();
    // getViteConfig resolves Astro's whole config; the flags are in what it is given.
    vi.doMock("astro/config", () => ({ getViteConfig: (config: unknown) => config }));
    const { default: config } = await import("../vitest.config");
    return (config as unknown as { test: { poolOptions: { forks: { execArgv: string[] } } } }).test.poolOptions.forks
      .execArgv;
  } finally {
    Object.defineProperty(process, "allowedNodeEnvironmentFlags", real);
    vi.doUnmock("astro/config");
  }
}
