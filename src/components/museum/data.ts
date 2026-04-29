import type { Experiment } from "@/data/experiments";
import type { Interactable } from "./engine/interactables";
import type { Direction } from "./engine/character";

export type WorkRef = { slug: string; title: string };

/**
 * Painting slots in the 14x10 hall. Paintings sit flush on the wall — 2x1 on
 * top/bottom walls, 1x2 on side walls — so they read as smaller artworks and
 * leave the perimeter row of the interior fully walkable.
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
  { tileX: 10, tileY: 0, width: 2, height: 1, face: "up" },
  { tileX: 13, tileY: 4, width: 1, height: 2, face: "right" },
  { tileX: 6, tileY: 9, width: 2, height: 1, face: "down" },
  { tileX: 0, tileY: 4, width: 1, height: 2, face: "left" },
];

/**
 * Computer-desk floor slots. Desks are 2x2 — they're the headline exhibits, so
 * they take up more visual space than the wall paintings.
 */
const DESK_SLOTS: Array<{ tileX: number; tileY: number }> = [
  { tileX: 2, tileY: 2 },
  { tileX: 7, tileY: 2 },
  { tileX: 11, tileY: 2 },
  { tileX: 2, tileY: 6 },
  { tileX: 7, tileY: 6 },
  { tileX: 11, tileY: 6 },
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
