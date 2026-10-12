/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Reuses Astro's Vite config so tests resolve the same `@/` alias and JSX
// setup as the site. Components that need a DOM opt in per file with
// `// @vitest-environment jsdom`.
export default getViteConfig({
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "node",
    // Node 25+ defines its own global localStorage, which hides jsdom's and is
    // undefined without --localstorage-file. Keep jsdom's.
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
  },
});
