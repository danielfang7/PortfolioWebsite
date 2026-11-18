// Value: protects=each hero stat shows a figure and a caption as a list item inside a hero block that stays hidden until the reveal shows it;
// fails_when=the stats wrapper goes back to a <p> (parsers hoist the <ul> out, so stats skip the reveal), a stat loses its value or label, or the list leaves the block;
// why_new=no test renders an .astro component, and Astro's compiler gives no diagnostic for a <ul> inside a <p>; seam=none (renders the component, parses like a browser);
// no_claim=the copy, numbers or count of stats, or the reveal's timing and visibility (CSS and GSAP; check in a browser).

import { getContainerRenderer } from "@astrojs/react";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { loadRenderers } from "astro:container";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import HeroSection from "@/components/HeroSection.astro";

/** Renders the hero to HTML, then parses it the way a browser does (this is where a <ul> inside a <p> gets moved). */
async function renderHero() {
  const container = await AstroContainer.create({ renderers: await loadRenderers([getContainerRenderer()]) });
  return new JSDOM(await container.renderToString(HeroSection)).window.document;
}

/**
 * The blocks the hero hides until its script reveals them, read from the
 * <noscript> rule that reveals the same blocks when JS is off.
 */
function revealedBlocks(document: Document) {
  const selectors = [...document.querySelectorAll("noscript")]
    .map((n) => (n.textContent ?? "").replace(/\/\*[\s\S]*?\*\//g, ""))
    .flatMap((css) => css.match(/[^{}]+(?=\{[^}]*opacity:\s*1\b)/g) ?? [])
    .map((s) => s.trim());
  return selectors.flatMap((s) => [...document.querySelectorAll(s)]);
}

/** Elements with no child elements whose text is not blank: the words a reader sees. */
const textParts = (el: Element) =>
  [...el.querySelectorAll("*")].filter((e) => e.children.length === 0 && (e.textContent ?? "").trim() !== "");

describe("HeroSection", () => {
  it("shows each stat as a figure and a caption inside a block the hero reveals", async () => {
    const document = await renderHero();
    const blocks = revealedBlocks(document);
    expect(blocks.length, "no <noscript> rule names the hero's revealed blocks").toBeGreaterThan(0);

    // The stats are the hero's lists outside the social-links <nav>.
    const statLists = [...document.querySelectorAll("ul, ol, [role=list]")].filter((l) => !l.closest("nav"));
    expect(statLists.length, "no stats list in the hero").toBeGreaterThan(0);

    for (const list of statLists) {
      expect(blocks.some((b) => b.contains(list)), "the stats list sits outside every revealed block").toBe(true);
      const items = [...list.children].filter((c) => c.matches("li, [role=listitem]"));
      expect(items.length, "a stats list has no items").toBeGreaterThan(0);
      for (const item of items) {
        expect(textParts(item).length, `stat "${item.textContent?.trim()}" needs a figure and a caption`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});
