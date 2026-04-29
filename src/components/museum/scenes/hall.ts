import { TILE } from "../engine/tileAtlas";
import type { Tilemap } from "../engine/tilemap";
import type { Interactable } from "../engine/interactables";

export const HALL_WIDTH = 14;
export const HALL_HEIGHT = 10;

export const HALL_SPAWN = {
  tileX: 7,
  tileY: 4,
};

/**
 * Builds the single-room hall tilemap. Perimeter walls + floor interior. Then
 * applies interactables: paintings rewrite their footprint tiles to WALL
 * (non-walkable — the painting sprite draws over them in a later layer). Desks
 * become DESK tiles on the floor, non-walkable.
 */
export function createHallScene(interactables: Interactable[]): Tilemap {
  const tiles: number[] = new Array(HALL_WIDTH * HALL_HEIGHT).fill(TILE.FLOOR);
  const walkable: boolean[] = new Array(HALL_WIDTH * HALL_HEIGHT).fill(true);

  for (let x = 0; x < HALL_WIDTH; x++) {
    const top = x;
    const bottom = (HALL_HEIGHT - 1) * HALL_WIDTH + x;
    tiles[top] = TILE.WALL;
    tiles[bottom] = TILE.WALL;
    walkable[top] = false;
    walkable[bottom] = false;
  }
  for (let y = 0; y < HALL_HEIGHT; y++) {
    const left = y * HALL_WIDTH;
    const right = y * HALL_WIDTH + HALL_WIDTH - 1;
    tiles[left] = TILE.WALL;
    tiles[right] = TILE.WALL;
    walkable[left] = false;
    walkable[right] = false;
  }

  for (const it of interactables) {
    for (let dy = 0; dy < it.height; dy++) {
      for (let dx = 0; dx < it.width; dx++) {
        const x = it.tileX + dx;
        const y = it.tileY + dy;
        if (x < 0 || y < 0 || x >= HALL_WIDTH || y >= HALL_HEIGHT) continue;
        const i = y * HALL_WIDTH + x;
        if (it.kind === "painting") {
          tiles[i] = TILE.WALL;
        }
        // Computers leave the underlying floor tile and draw their sprite on
        // top in a later render pass, just like paintings.
        walkable[i] = false;
      }
    }
  }

  return { width: HALL_WIDTH, height: HALL_HEIGHT, tiles, walkable };
}
