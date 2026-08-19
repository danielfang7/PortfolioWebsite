import type { Character, Direction } from "./character";

export type InteractableKind = "computer" | "investment";

export type Interactable = {
  kind: InteractableKind;
  slug: string;
  title: string;
  /** Anchor (top-left) tile. */
  tileX: number;
  tileY: number;
  /** Size in tiles. Desks and pedestals are both 2x2. */
  width: number;
  height: number;
  /**
   * Direction the player must face to focus this hotspot. `null` means any
   * side (desks).
   */
  face: Direction | null;
  /** Accent color for static tinting / glow variants. */
  color?: string;
};

export const DIR_DELTA: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function occupies(
  it: Interactable,
  tx: number,
  ty: number,
): boolean {
  return (
    tx >= it.tileX &&
    tx < it.tileX + it.width &&
    ty >= it.tileY &&
    ty < it.tileY + it.height
  );
}

/** The interactable whose footprint covers the given tile, if any. */
export function interactableAtTile(
  interactables: Interactable[],
  tx: number,
  ty: number,
): Interactable | null {
  for (const it of interactables) {
    if (occupies(it, tx, ty)) return it;
  }
  return null;
}

/**
 * The interactable the player is standing in front of and facing. For
 * multi-tile interactables, any occupied tile being the "front tile" counts.
 */
export function focusedInteractable(
  ch: Character,
  interactables: Interactable[],
  tileSize: number,
): Interactable | null {
  const pTileX = Math.floor(ch.x / tileSize);
  const pTileY = Math.floor(ch.y / tileSize);
  const d = DIR_DELTA[ch.facing];
  const frontX = pTileX + d.x;
  const frontY = pTileY + d.y;

  for (const it of interactables) {
    if (!occupies(it, frontX, frontY)) continue;
    if (it.face !== null && it.face !== ch.facing) continue;
    return it;
  }
  return null;
}
