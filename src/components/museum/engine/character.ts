import { TILE_SIZE } from "./tileAtlas";
import { isWalkable, type Tilemap } from "./tilemap";
import type { InputState } from "./input";

export type Direction = "down" | "up" | "left" | "right";

export type Character = {
  /** Pixel coord of character center (feet-level). */
  x: number;
  y: number;
  /** Current velocity in px/s — smoothed toward the input target each frame. */
  vx: number;
  vy: number;
  /** Hitbox size used for collision. Narrower than sprite so corners don't snag. */
  w: number;
  h: number;
  /** Top speed in pixels per second. */
  speed: number;
  facing: Direction;
  /** True while the character is actually moving (drives the walk animation). */
  moving: boolean;
  /** 0..1 walk-cycle phase, advanced by distance travelled so the step cadence
   * stays tied to speed regardless of frame rate. */
  walkPhase: number;
};

/** How quickly velocity chases the input target. Higher = snappier; this value
 * reaches ~full speed in ~90ms, which reads as responsive-but-weighty. */
const RESPONSIVENESS = 26;
/** Pixels travelled per full two-step walk cycle. */
const STRIDE_PIXELS = 26;

export function createCharacter(tileX: number, tileY: number): Character {
  return {
    x: tileX * TILE_SIZE + TILE_SIZE / 2,
    y: tileY * TILE_SIZE + TILE_SIZE / 2,
    vx: 0,
    vy: 0,
    w: 12,
    h: 10,
    speed: 112,
    facing: "down",
    moving: false,
    walkPhase: 0,
  };
}

export function updateCharacter(
  ch: Character,
  input: InputState,
  map: Tilemap,
  dt: number,
): void {
  // Combine digital keys with the analog touch vector, then clamp to the unit
  // circle so diagonals (and a maxed-out joystick) never exceed top speed.
  let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0) + input.axisX;
  let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0) + input.axisY;
  const mag = Math.hypot(dx, dy);
  if (mag > 1) {
    dx /= mag;
    dy /= mag;
  }

  // Facing tracks the dominant input axis so it flips the instant a key is
  // pressed, independent of the smoothed velocity (which lags slightly).
  if (dx !== 0 || dy !== 0) {
    if (Math.abs(dx) > Math.abs(dy)) {
      ch.facing = dx < 0 ? "left" : "right";
    } else {
      ch.facing = dy < 0 ? "up" : "down";
    }
  }

  // Frame-rate-independent exponential smoothing toward the target velocity.
  const targetVx = dx * ch.speed;
  const targetVy = dy * ch.speed;
  const k = 1 - Math.exp(-dt * RESPONSIVENESS);
  ch.vx += (targetVx - ch.vx) * k;
  ch.vy += (targetVy - ch.vy) * k;
  // Snap to rest so the character doesn't creep at sub-pixel speeds.
  if (dx === 0 && Math.abs(ch.vx) < 1.5) ch.vx = 0;
  if (dy === 0 && Math.abs(ch.vy) < 1.5) ch.vy = 0;

  // Axis-separated collision — lets the character slide along walls instead of
  // sticking when moving diagonally into a corner. Kill the velocity on a
  // blocked axis so it doesn't accumulate against the wall.
  const nx = ch.x + ch.vx * dt;
  if (canStand(map, nx, ch.y, ch.w, ch.h)) ch.x = nx;
  else ch.vx = 0;
  const ny = ch.y + ch.vy * dt;
  if (canStand(map, ch.x, ny, ch.w, ch.h)) ch.y = ny;
  else ch.vy = 0;

  // Animation: advance the walk phase by actual distance covered this frame.
  const moved = Math.hypot(ch.vx, ch.vy);
  ch.moving = moved > 6;
  if (ch.moving) {
    ch.walkPhase = (ch.walkPhase + (moved * dt) / STRIDE_PIXELS) % 1;
  } else {
    ch.walkPhase = 0;
  }
}

export function canStand(
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
