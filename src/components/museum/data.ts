import type { Experiment } from "@/data/experiments";
import type { Interactable } from "./engine/interactables";
import type { Direction } from "./engine/character";

export type WorkRef = {
  slug: string;
  title: string;
  description: string;
  role: string;
  year: string;
  stack: string[];
  thumbnail: string;
  liveUrl?: string;
  sourceUrl?: string;
};

/**
 * Painting slots on the Gallery walls (room 0, world cols 0-13). Paintings sit
 * flush on the wall — 2x1 on top/bottom walls, 1x2 on side walls — so they read
 * as smaller artworks and leave the perimeter row of the interior walkable.
 * Kept clear of the east doorway (col 13, rows 4-5). Capacity exceeds the
 * current experiment count so a newly added experiment still finds a wall.
 */
const PAINTING_SLOTS: Array<{
  tileX: number;
  tileY: number;
  width: number;
  height: number;
  face: Direction;
}> = [
  { tileX: 2, tileY: 0, width: 2, height: 1, face: "up" },
  { tileX: 6, tileY: 0, width: 2, height: 1, face: "up" },
  { tileX: 9, tileY: 0, width: 2, height: 1, face: "up" },
  { tileX: 3, tileY: 9, width: 2, height: 1, face: "down" },
  { tileX: 8, tileY: 9, width: 2, height: 1, face: "down" },
  { tileX: 11, tileY: 9, width: 2, height: 1, face: "down" },
  { tileX: 0, tileY: 1, width: 1, height: 2, face: "right" },
  { tileX: 0, tileY: 4, width: 1, height: 2, face: "right" },
];

/**
 * Computer-desk floor slots in the Workshop (room 1, world cols 14-27). Desks
 * are 2x2 — the headline exhibits — laid out as a 4×2 grid (cols 16/19/22/25)
 * pushed flush against the top and bottom walls (rows 1 and 7). That leaves a
 * roomy 4-tile-tall central plaza (rows 3-6) to walk through, with the west
 * doorway (rows 4-5) and its hanging sign opening straight into the clear lane.
 */
const DESK_SLOTS: Array<{ tileX: number; tileY: number }> = [
  { tileX: 16, tileY: 1 },
  { tileX: 19, tileY: 1 },
  { tileX: 22, tileY: 1 },
  { tileX: 25, tileY: 1 },
  { tileX: 16, tileY: 7 },
  { tileX: 19, tileY: 7 },
  { tileX: 22, tileY: 7 },
  { tileX: 25, tileY: 7 },
];

export function buildWorldInteractables(
  experiments: Experiment[],
  works: WorkRef[],
): Interactable[] {
  const result: Interactable[] = [];

  // Surface silent truncation during development: if there are more exhibits
  // than wall/floor slots, the overflow only appears in the list view.
  if (import.meta.env.DEV) {
    if (experiments.length > PAINTING_SLOTS.length) {
      console.warn(
        `[museum] ${experiments.length - PAINTING_SLOTS.length} experiment(s) hidden — add PAINTING_SLOTS in data.ts.`,
      );
    }
    if (works.length > DESK_SLOTS.length) {
      console.warn(
        `[museum] ${works.length - DESK_SLOTS.length} work(s) hidden — add DESK_SLOTS in data.ts.`,
      );
    }
  }

  experiments.slice(0, PAINTING_SLOTS.length).forEach((exp, i) => {
    const slot = PAINTING_SLOTS[i];
    result.push({
      kind: "painting",
      slug: exp.slug,
      title: exp.title,
      tileX: slot.tileX,
      tileY: slot.tileY,
      width: slot.width,
      height: slot.height,
      face: slot.face,
      color: exp.color,
    });
  });

  works.slice(0, DESK_SLOTS.length).forEach((work, i) => {
    const slot = DESK_SLOTS[i];
    result.push({
      kind: "computer",
      slug: work.slug,
      title: work.title,
      tileX: slot.tileX,
      tileY: slot.tileY,
      width: 2,
      height: 2,
      face: null,
    });
  });

  return result;
}
