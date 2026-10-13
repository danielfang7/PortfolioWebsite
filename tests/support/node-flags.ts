/**
 * Keeps only the Node flags this runtime accepts. An unknown flag kills every
 * vitest worker at startup with an opaque EPIPE, before node-version.test.ts can
 * say which Node is running.
 */
export function supportedNodeFlags(
  flags: string[],
  allowed: ReadonlySet<string> = process.allowedNodeEnvironmentFlags,
): string[] {
  return flags.filter((flag) => allowed.has(flag));
}
