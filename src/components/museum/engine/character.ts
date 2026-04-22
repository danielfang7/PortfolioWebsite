import { TILE_SIZE } from "./tileAtlas";
import { isWalkable, type Tilemap } from "./tilemap";
import type { InputState } from "./input";

export type Direction = "down" | "up" | "left" | "right";

export type Character = {
  /** Pixel coord of character center (feet-level). */
  x: number;
  y: number;
  /** Hitbox size used for collision. Narrower than sprite so corners don't snag. */
  w: number;
  h: number;
  /** Pixels per second. */
  speed: number;
  facing: Direction;
};

export function createCharacter(tileX: number, tileY: number): Character {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
    w: 12,
    h: 10,
    speed: 112,
    facing: "down",
  };
}

export function updateCharacter(
  ch: Character,
  input: InputState,
  map: Tilemap,
  dt: number,
): void {
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;

  if (dx !== 0 && dy !== 0) {
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }

  // Facing tracks dominant axis so holding up+right keeps you facing whichever
  // was pressed most recently — good enough without an explicit "last dir" field.
  if (dx !== 0 || dy !== 0) {
    if (Math.abs(dx) > Math.abs(dy)) {
      ch.facing = dx < 0 ? "left" : "right";
    } else {
      ch.facing = dy < 0 ? "up" : "down";
    }
  }

  const dist = ch.speed * dt;
  const nx = ch.x + dx * dist;
  const ny = ch.y + dy * dist;

  // Axis-separated collision — lets the character slide along walls instead of
  // sticking when moving diagonally into a corner.
  if (canStand(map, nx, ch.y, ch.w, ch.h)) ch.x = nx;
  if (canStand(map, ch.x, ny, ch.w, ch.h)) ch.y = ny;
}

function canStand(
  map: Tilemap,
  cx: number,
  cy: number,
  w: number,
  h: number,
): boolean {
  const left = cx - w / 2;
  const right = cx + w / 2 - 1;
  const top = cy - h / 2;
  const bottom = cy + h / 2 - 1;
  // Four hitbox corners — every corner must land on a walkable tile.
  return (
    isWalkable(map, (left / TILE_SIZE) | 0, (top / TILE_SIZE) | 0) &&
    isWalkable(map, (right / TILE_SIZE) | 0, (top / TILE_SIZE) | 0) &&
    isWalkable(map, (left / TILE_SIZE) | 0, (bottom / TILE_SIZE) | 0) &&
    isWalkable(map, (right / TILE_SIZE) | 0, (bottom / TILE_SIZE) | 0)
  );
}
