import type { Character, Direction } from "./character";

export type InteractableKind = "painting" | "computer";

export type Interactable = {
  kind: InteractableKind;
  slug: string;
  title: string;
  /** Anchor (top-left) tile. */
  tileX: number;
  tileY: number;
  /** Size in tiles. Paintings are 2x2, desks are 1x1. */
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

const DIR_DELTA: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function occupies(it: Interactable, tx: number, ty: number): boolean {
  return (
    tx >= it.tileX &&
    tx < it.tileX + it.width &&
    ty >= it.tileY &&
    ty < it.tileY + it.height
  );
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

/**
 * Nearest interactable within `radius` Manhattan tiles of the player (measured
 * to the closest tile of the interactable's footprint).
 */
export function nearbyInteractable(
  ch: Character,
  interactables: Interactable[],
  tileSize: number,
  radius = 3,
): Interactable | null {
  const pTileX = Math.floor(ch.x / tileSize);
  const pTileY = Math.floor(ch.y / tileSize);
  let best: Interactable | null = null;
  let bestDist = Infinity;
  for (const it of interactables) {
    const dist = footprintDist(pTileX, pTileY, it);
    if (dist > radius) continue;
    if (dist < bestDist) {
      bestDist = dist;
      best = it;
    }
  }
  return best;
}

function footprintDist(px: number, py: number, it: Interactable): number {
  const dx = Math.max(0, it.tileX - px, px - (it.tileX + it.width - 1));
  const dy = Math.max(0, it.tileY - py, py - (it.tileY + it.height - 1));
  return dx + dy;
}
