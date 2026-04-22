import type { Experiment } from "@/data/experiments";
import type { Interactable } from "./engine/interactables";
import type { Direction } from "./engine/character";

export type WorkRef = { slug: string; title: string };

export const PAINTING_TILES_W = 2;
export const PAINTING_TILES_H = 2;

/**
 * Painting slots in the 14x10 hall. Each painting is 2x2 tiles. Anchor = top-
 * left tile. Top-wall anchors at y=0 extend down to y=1 (non-walkable into the
 * interior). Same idea for bottom/left/right walls.
 */
const PAINTING_SLOTS: Array<{ tileX: number; tileY: number; face: Direction }> =
  [
    { tileX: 2, tileY: 0, face: "up" },
    { tileX: 6, tileY: 0, face: "up" },
    { tileX: 10, tileY: 0, face: "up" },
    { tileX: 12, tileY: 4, face: "right" },
    { tileX: 6, tileY: 8, face: "down" },
    { tileX: 0, tileY: 4, face: "left" },
  ];

/** Computer-desk floor-slots. Desks are 1x1. */
const DESK_SLOTS: Array<{ tileX: number; tileY: number }> = [
  { tileX: 3, tileY: 6 },
  { tileX: 7, tileY: 6 },
  { tileX: 11, tileY: 6 },
  { tileX: 5, tileY: 3 },
  { tileX: 9, tileY: 3 },
];

export function buildHallInteractables(
  experiments: Experiment[],
  works: WorkRef[],
): Interactable[] {
  const result: Interactable[] = [];

  experiments.slice(0, PAINTING_SLOTS.length).forEach((exp, i) => {
    const slot = PAINTING_SLOTS[i];
    result.push({
      kind: "painting",
      slug: exp.slug,
      title: exp.title,
      tileX: slot.tileX,
      tileY: slot.tileY,
      width: PAINTING_TILES_W,
      height: PAINTING_TILES_H,
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
      width: 1,
      height: 1,
      face: null,
    });
  });

  return result;
}
