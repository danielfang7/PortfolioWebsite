// @vitest-environment jsdom
//
// Value: protects=the home page's server-rendered museum island (Museum in attract
// mode, which renders MuseumCanvas) hydrates without a React mismatch on any device,
// and both pointer hints ship in the server markup behind a (pointer: coarse) media
// query; fails_when=Museum or MuseumCanvas reads a browser-only value (pointer type,
// reduced motion, any media query) while choosing its first render, or a hint goes
// back to JS state; why_new=the home page threw hydration errors #425/#418/#423 on
// every touch device because the hint text differed between server and first client
// render; seam=none; no_claim=that the media query shows the right span (jsdom
// ignores CSS media queries; checked in a real browser) or canvas drawing.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { screen } from "@testing-library/react";
import Museum from "@/components/museum/Museum";
import MuseumCanvas from "@/components/museum/MuseumCanvas";
import { planRooms } from "@/components/museum/scenes/world";
import type { WorkRef } from "@/components/museum/data";

const works: WorkRef[] = [
  {
    slug: "example",
    title: "Example",
    description: "An example work",
    role: "Founder",
    year: "2026",
    stack: ["TypeScript"],
    thumbnail: "/images/works/example.jpg",
    color: "#00D8FF",
  },
];
const rooms = planRooms({ computer: works.length, investment: 0 });

// The island LabPreview.astro hydrates on the home page, and the canvas on its own.
const islands: [string, () => ReactElement][] = [
  ["Museum (home attract preview)", () => <Museum works={works} investments={[]} attract />],
  ["MuseumCanvas", () => <MuseumCanvas works={works} investments={[]} rooms={rooms} />],
];

/** Renders like the Astro build server: no window, so no media queries at all. */
function serverRender(ui: ReactElement) {
  vi.stubGlobal("window", undefined);
  try {
    return renderToString(ui);
  } finally {
    vi.unstubAllGlobals();
  }
}

function setMediaQueries(matches: boolean) {
  window.matchMedia = vi.fn((media: string) => ({
    matches,
    media,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("museum hydration", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let root: Root | undefined;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // jsdom has no 2D canvas; the render loop already bails when there is no context.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    // jsdom has no Web Animations API; WingBanner animates its label in an effect.
    Element.prototype.animate = vi.fn(() => ({ cancel: () => {} })) as unknown as Element["animate"];
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await act(async () => root?.unmount());
    root = undefined;
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  // true: a touch screen with reduced motion, where every query matches.
  // false: a mouse, where none do.
  it.each(islands.flatMap(([name, ui]) => [true, false].map((m) => [name, m, ui] as const)))(
    "%s hydrates the server markup (every media query matches: %s)",
    async (_name, matches, ui) => {
      const container = document.createElement("div");
      container.innerHTML = serverRender(ui());
      document.body.appendChild(container);

      setMediaQueries(matches);
      const errors: unknown[] = [];
      await act(async () => {
        root = hydrateRoot(container, ui(), { onRecoverableError: (e) => errors.push(e) });
      });

      expect(errors).toEqual([]);
      // React 18 logs mismatches with a varying number of format arguments.
      const warnings = consoleError.mock.calls.filter(([msg]) => /hydrat|did not match/i.test(String(msg)));
      expect(warnings).toEqual([]);
    },
  );

  it("ships both hints in the server markup, picked by a (pointer: coarse) media query", () => {
    document.body.innerHTML = serverRender(islands[0][1]());
    const touchOnly = "hidden [@media(pointer:coarse)]:inline";
    const mouseOnly = "[@media(pointer:coarse)]:hidden";
    expect(screen.getByText("Tap to take control · drag to move").className).toBe(touchOnly);
    expect(screen.getByText("Click to take control · click to walk").className).toBe(mouseOnly);
    expect(screen.getByText("Drag to move · tap an exhibit to open").className).toBe(touchOnly);
    expect(screen.getByText("Click to walk · WASD / arrows · E to interact").className).toBe(mouseOnly);
  });
});
