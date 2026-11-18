// Value: protects=CSS inside every island's inline <style> reaches the browser exactly
// as written under React 18 SSR; fails_when=a quote, apostrophe, angle bracket or
// ampersand lands in that CSS (React escapes it to &quot; &#x27; &gt; &lt; &amp;,
// which the browser keeps literally inside <style>, breaking the rule before
// hydration and causing a hydration text mismatch); why_new=this bug shipped in
// GladeKitAgentLoop and GladeCorePipeline; seam=none (public components);
// no_claim=other hydration causes.

import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { JSDOM } from "jsdom";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GladeCorePipeline } from "@/components/case-studies/GladeCorePipeline";
import { GladeKitAgentLoop } from "@/components/case-studies/GladeKitAgentLoop";
import { PaawImpactChart } from "@/components/case-studies/PaawImpactChart";
import { PaawJourney } from "@/components/case-studies/PaawJourney";
import { PaawPlatform } from "@/components/case-studies/PaawPlatform";
import { PokelitReturnsChart } from "@/components/case-studies/PokelitReturnsChart";
import { PokelitScanFlow } from "@/components/case-studies/PokelitScanFlow";
import { PokelitSystem } from "@/components/case-studies/PokelitSystem";
import { StatRow } from "@/components/case-studies/StatRow";
import { GitHubActivity, type DisplayEvent } from "@/components/GitHubActivity";

const event: DisplayEvent = {
  id: "1",
  type: "push",
  color: "#00D8FF",
  repo: "example",
  title: "Example commit",
  time: "1h ago",
  dateLabel: "Today",
  url: "https://github.com/example/example",
};

const cases: [string, ComponentType<any>, object][] = [
  ["GladeCorePipeline", GladeCorePipeline, {}],
  ["GladeKitAgentLoop", GladeKitAgentLoop, {}],
  ["PaawImpactChart", PaawImpactChart, {}],
  ["PaawJourney", PaawJourney, {}],
  ["PaawPlatform", PaawPlatform, {}],
  ["PokelitReturnsChart", PokelitReturnsChart, {}],
  ["PokelitScanFlow", PokelitScanFlow, {}],
  ["PokelitSystem", PokelitSystem, {}],
  ["StatRow", StatRow, { stats: [{ value: "1", label: "one" }] }],
  ["GitHubActivity", GitHubActivity, { initialEvents: [event] }],
];

describe("inline <style> survives React 18 SSR unescaped", () => {
  it("covers every component that ships an inline <style>", () => {
    const withStyle = (readdirSync("src/components", { recursive: true }) as string[])
      .filter((f) => f.endsWith(".tsx") && readFileSync(join("src/components", f), "utf8").includes("<style"))
      .map((f) => basename(f, ".tsx"));
    const covered = new Set(cases.map(([name]) => name));
    expect(withStyle.filter((name) => !covered.has(name)), "add these to `cases`").toEqual([]);
  });

  it.each(cases)("%s", (_name, Component, props) => {
    const html = renderToString(createElement(Component, props));
    const css = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    // Every component listed here ships CSS this way (PaawOscarFlow has no <style>).
    expect(css.length).toBeGreaterThan(0);
    for (const block of css) {
      expect(block).not.toMatch(/&(quot|#x27|#39|gt|lt|amp);/);
    }
  });
});

// Value: protects=each PaawImpactChart row prints its reduction as a whole percent from 0 to 100,
// the unit its bar width also uses; fails_when=a reduction is entered as a fraction (0.93, the
// removed ratio field's unit), an unrounded quotient (80.57), over 100, or goes missing;
// why_new=the test above renders the chart but reads only its <style>, and TypeScript allows any
// number; seam=none; no_claim=that each figure matches its measurement or that the bar's drawn
// length matches the figure (layout: check in a browser).
describe("PaawImpactChart", () => {
  it("prints each row's reduction as a whole percent from 0 to 100", () => {
    const { document } = new JSDOM(renderToStaticMarkup(createElement(PaawImpactChart))).window;
    const rows = [...document.querySelectorAll("[role=listitem], li")];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      // The figure is the element reading "−N%"; the label and the note under the bar are separate elements.
      const figure = [...row.querySelectorAll("*")]
        .map((el) => el.textContent?.trim() ?? "")
        .find((text) => /^[−-].*%$/.test(text));
      const percent = figure?.slice(1, -1).trim() ?? "";
      expect(percent, `${row.textContent}`).toMatch(/^\d{1,3}$/);
      expect(Number(percent), `${row.textContent}`).toBeLessThanOrEqual(100);
    }
  });
});
