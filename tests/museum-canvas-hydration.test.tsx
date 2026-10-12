// @vitest-environment jsdom
//
// Value: protects=the home page's server-rendered museum preview hydrates without a
// React mismatch on touch devices; fails_when=MuseumCanvas reads the pointer type
// (or any other browser-only value) while choosing its first render; why_new=the
// home page threw hydration errors #425/#418/#423 on every touch device because
// the hint text differed between server and first client render; seam=none;
// no_claim=canvas drawing (jsdom has no 2D context, so the render loop bails).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { screen } from "@testing-library/react";
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
const ui = () => <MuseumCanvas works={works} investments={[]} rooms={rooms} />;

function setPointer(coarse: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches: query.includes("pointer: coarse") ? coarse : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

/**
 * Renders the markup the server would produce (the build server has no touch
 * screen), then hydrates it as `pointer` and returns React's recoverable errors.
 */
async function hydrateAs(pointer: "coarse" | "fine") {
  setPointer(false);
  const container = document.createElement("div");
  container.innerHTML = renderToString(ui());
  document.body.appendChild(container);

  setPointer(pointer === "coarse");
  const errors: unknown[] = [];
  let root: Root | undefined;
  await act(async () => {
    root = hydrateRoot(container, ui(), { onRecoverableError: (e) => errors.push(e) });
  });
  return { errors, unmount: () => act(() => root?.unmount()) };
}

describe("MuseumCanvas hydration", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    // jsdom has no 2D canvas; the render loop already bails when there is no context.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    // jsdom has no Web Animations API; WingBanner animates its label in an effect.
    Element.prototype.animate = vi.fn(() => ({ cancel: () => {} })) as unknown as Element["animate"];
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("hydrates the server markup on a touch device, then shows the touch hint", async () => {
    const { errors, unmount } = await hydrateAs("coarse");
    expect(errors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringMatching(/hydrat|did not match/i), expect.anything());
    expect(screen.getByText("Drag to move · tap an exhibit to open")).toBeTruthy();
    await unmount();
  });

  it("hydrates on a precise pointer and keeps the keyboard hint", async () => {
    const { errors, unmount } = await hydrateAs("fine");
    expect(errors).toEqual([]);
    expect(screen.getByText("Click to walk · WASD / arrows · E to interact")).toBeTruthy();
    await unmount();
  });
});
