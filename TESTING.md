# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence — without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Framework

[Vitest](https://vitest.dev) 3, configured through Astro's Vite config (`vitest.config.ts` uses `getViteConfig`), so tests resolve the same `@/` alias and JSX setup as the site. React components are tested with `react-dom/server`, `react-dom/client` and [Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

## Running

```bash
npm test            # vitest run
npx vitest          # watch mode
```

GitHub Actions (`.github/workflows/test.yml`) runs `npm test` then `npm run build` on every PR and push to main. Netlify's build command is `npm test && npm run build`, so a red suite also fails the deploy. Both read the Node version from `.nvmrc`, and `tests/node-version.test.ts` fails if the running Node major differs (a `NODE_VERSION` set in Netlify's UI would override the file).

## Layers

- **Unit / component** (`tests/*.test.tsx`): render a component the way Astro does. Server-render with `renderToString` while browser globals (`window`, `document`, `navigator`, storage, `matchMedia` and the rest of the list in `tests/museum-hydration.test.tsx`) are stubbed out, since the build server has none, then hydrate with `hydrateRoot` in jsdom when the behaviour depends on the browser.
- **Content** (`tests/*.test.ts`, node environment): read `src/content/` and `public/` and check invariants the build does not, such as root media paths, image siblings and unique `order` values. `tests/node-version.test.ts` also runs here and checks the Node major against `.nvmrc`.
- **Build** (`npm run build`): Astro validates content collection schemas and renders every page; CI runs it after the tests.
- **E2E**: none yet. Browser-level checks (layout at phone widths, console errors) are done by hand with Playwright; a Playwright suite would be the next layer.

## Conventions

- Files live in `tests/` and end in `.test.ts` or `.test.tsx`.
- Components that need a DOM start with `// @vitest-environment jsdom`; everything else runs in node.
- Start each test file with a value card: what it protects, the regression that makes it fail, why existing coverage misses it, and what green does not prove.
- jsdom lacks canvas 2D and the Web Animations API: stub `HTMLCanvasElement.prototype.getContext` and `Element.prototype.animate` in the test, never in product code.
- jsdom also ignores CSS media queries. Copy that depends on the device (see `src/components/museum/ui/PointerHint.tsx`) is chosen in CSS, so tests check the markup and a real browser checks what shows.
- A bug fix lands with a test that fails before the fix and passes after.
