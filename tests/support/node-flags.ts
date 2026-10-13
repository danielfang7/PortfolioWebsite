/**
 * Keeps only the Node flags this runtime lists in process.allowedNodeEnvironmentFlags
 * (the flags NODE_OPTIONS accepts). An unknown flag kills every vitest worker at
 * startup with an opaque EPIPE, before node-version.test.ts can say which Node is
 * running. Command-line-only flags (--expose-internals) are not listed and get
 * dropped; tests/node-flags.test.ts fails if vitest.config.ts asks for one.
 */
export function supportedNodeFlags(
  flags: string[],
  allowed: ReadonlySet<string> = process.allowedNodeEnvironmentFlags,
): string[] {
  return flags.filter((flag) => allowed.has(flag));
}
