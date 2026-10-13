// Value: protects=touch visitors see the touch hint on first paint; fails_when=
// Tailwind stops emitting the [@media(pointer:coarse)] variants PointerHint uses
// (the content glob stops covering src/components, a Tailwind upgrade changes
// arbitrary variants) or emits them before .hidden so the touch span stays hidden;
// why_new=jsdom ignores media queries, so museum-hydration only sees class names;
// seam=none (runs the project's own Tailwind config over src/); no_claim=which
// pointer type a real device reports.

import postcss, { type AtRule, type Rule } from "postcss";
import tailwindcss from "tailwindcss";
import { expect, it } from "vitest";
import config from "../tailwind.config.mjs";

it("emits PointerHint's coarse-pointer rules after .hidden", async () => {
  const { root } = await postcss([tailwindcss(config)]).process("@tailwind utilities;", { from: undefined });
  const nodes = root.nodes;

  const hidden = nodes.findIndex((n) => n.type === "rule" && (n as Rule).selector === ".hidden");
  // Tailwind writes `@media(pointer:coarse)` with no space, which postcss parses
  // as an at-rule named "media(pointer:coarse)", so match name and params together.
  const media = nodes.findIndex(
    (n) => n.type === "atrule" && /^media\s*\(pointer:\s*coarse\)/.test(`${(n as AtRule).name}${(n as AtRule).params}`),
  );
  expect(hidden, ".hidden is emitted").toBeGreaterThanOrEqual(0);
  expect(media, "a (pointer: coarse) media block is emitted").toBeGreaterThan(hidden);

  const display: Record<string, string> = {};
  (nodes[media] as AtRule).walkRules((rule) => {
    rule.walkDecls("display", (decl) => {
      display[rule.selector] = decl.value;
    });
  });
  // Tailwind escapes the arbitrary variant: .\[\@media\(pointer\:coarse\)\]\:hidden
  const pick = (suffix: string) => Object.entries(display).find(([sel]) => sel.endsWith(suffix))?.[1];
  expect(pick("\\:hidden"), "mouse copy hides on coarse pointers").toBe("none");
  expect(pick("\\:inline"), "touch copy shows on coarse pointers").toBe("inline");
});
