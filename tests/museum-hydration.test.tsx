// @vitest-environment jsdom
//
// Value: protects=the home page's server-rendered museum island (Museum in attract
// mode, which renders MuseumCanvas) hydrates without a React mismatch on any device,
// and both pointer hints ship in the server markup behind a (pointer: coarse) media
// query; fails_when=Museum or anything it renders reads a browser-only value (media
// queries, storage, document, navigator) while choosing its first render, or a hint
// goes back to JS state; why_new=the home page threw hydration errors #425/#418/#423
// on every touch device because the hint text differed between server and first
// client render; seam=none; no_claim=that the media query shows the right span
// (jsdom ignores CSS media queries; checked in a real browser) or canvas drawing.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, type ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { screen } from "@testing-library/react";
import Museum from "@/components/museum/Museum";
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

// The island LabPreview.astro hydrates on the home page. /lab mounts Museum with
// client:only, so this is the only server-rendered museum.
const ui = () => <Museum works={works} investments={[]} attract />;

// The browser globals a component is likely to read while rendering. The Astro
// build server has none of them; jsdom defines hundreds more, so this list is a
// floor, not a full model of Node.
const BROWSER_GLOBALS = [
  "window", "self", "document", "navigator", "location", "history", "screen",
  "localStorage", "sessionStorage", "matchMedia", "getComputedStyle",
  "innerWidth", "innerHeight", "devicePixelRatio", "ontouchstart",
  "requestAnimationFrame", "cancelAnimationFrame",
];

/** Renders like the Astro build server, with the browser globals above hidden. */
function serverRender(el: ReactElement) {
  for (const name of BROWSER_GLOBALS) vi.stubGlobal(name, undefined);
  try {
    return renderToString(el);
  } finally {
    vi.unstubAllGlobals();
  }
}

/** Makes navigator look like a phone too, for touch checks that skip matchMedia. */
function pretendToBeAPhone() {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148",
  );
  Object.defineProperty(navigator, "maxTouchPoints", { value: 5, configurable: true });
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
    delete (navigator as { maxTouchPoints?: number }).maxTouchPoints;
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it.each([
    ["a phone with reduced motion (every media query matches)", true, false],
    ["a mouse (no media query matches)", false, false],
    ["a returning visitor who turned sound on", false, true],
  ])("hydrates the server markup for %s", async (_name, phone, soundOn) => {
    const container = document.createElement("div");
    container.innerHTML = serverRender(ui());
    document.body.appendChild(container);

    setMediaQueries(phone);
    if (phone) pretendToBeAPhone();
    if (soundOn) localStorage.setItem("museumSoundOn", "1");
    const errors: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(container, ui(), { onRecoverableError: (e) => errors.push(e) });
    });

    expect(errors).toEqual([]);
    // React 18 warns about attribute and text mismatches through console.error, once
    // per module load, so any call at all fails the row that caused it.
    expect(consoleError).not.toHaveBeenCalled();
    // The stored preference was read, so this row really is a returning visitor.
    screen.getByRole("button", { name: soundOn ? "Turn museum sound off" : "Turn museum sound on" });
  });

  it("ships both hints in the server markup, picked by a (pointer: coarse) media query", () => {
    document.body.innerHTML = serverRender(ui());
    const touch = ["Tap to take control · drag to move", "Drag to move · tap an exhibit to open"];
    const mouse = ["Click to take control · click to walk", "Click to walk · WASD / arrows · E to interact"];
    for (const text of touch) {
      const { classList } = screen.getByText(text);
      expect(classList.contains("hidden") && classList.contains("[@media(pointer:coarse)]:inline"), text).toBe(true);
    }
    for (const text of mouse) {
      const { classList } = screen.getByText(text);
      expect(!classList.contains("hidden") && classList.contains("[@media(pointer:coarse)]:hidden"), text).toBe(true);
    }
  });
});
