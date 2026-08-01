import { TILE_SIZE } from "./tileAtlas";
import { canStand, type Character, type Direction } from "./character";
import { isWalkable, type Tilemap } from "./tilemap";
import type { InputState } from "./input";
import { DIR_DELTA, occupies, type Interactable } from "./interactables";

/**
 * Click-to-walk navigation. Mouse visitors get the same reach as the keyboard:
 * click a patch of floor and the character walks there; click an exhibit and it
 * walks to the viewing spot, turns to face it, and opens it on arrival.
 *
 * Like the attract-mode autopilot, this steers by writing the analog input axis
 * rather than moving the character directly, so the real movement and collision
 * code stays the single source of truth for how walking feels.
 */

/** A step along the route, in world pixels (tile centres). */
type Waypoint = { x: number; y: number };

export type Navigator = {
  active: boolean;
  path: Waypoint[];
  index: number;
  /** Destination in world px — drives the click marker. Null when idle. */
  marker: { x: number; y: number } | null;
  /** Exhibit to face and open on arrival, when the walk began on one. */
  target: { it: Interactable; facing: Direction } | null;
  /** Seconds spent chasing the current waypoint, for the stall guard. */
  elapsed: number;
};

/** Arrival radius (px) for intermediate waypoints — loose keeps the walk fluid. */
const ARRIVE = 7;
/** Tighter radius for the final step so the character lands on the tile. */
const ARRIVE_FINAL = 3;
/**
 * Abandon a leg that takes implausibly long. Nothing in the world should block
 * a BFS-verified route, but bailing out beats a character stuck walking a wall.
 */
const STALL_SECONDS = 4;

const NEIGHBORS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function createNavigator(): Navigator {
  return {
    active: false,
    path: [],
    index: 0,
    marker: null,
    target: null,
    elapsed: 0,
  };
}

/** Centre of a tile, in world pixels. */
function tileCentre(tx: number, ty: number): Waypoint {
  return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
}

/**
 * Breadth-first search across walkable tiles from the character's tile to the
 * first tile satisfying `isGoal`. Breadth-first means the first goal reached is
 * the nearest one, which is exactly the "walk to the closest viewing spot"
 * behaviour we want when an exhibit has several valid approaches.
 */
function findRoute(
  map: Tilemap,
  startTx: number,
  startTy: number,
  isGoal: (tx: number, ty: number) => boolean,
): Array<{ tx: number; ty: number }> | null {
  const w = map.width;
  const h = map.height;
  if (startTx < 0 || startTy < 0 || startTx >= w || startTy >= h) return null;

  const start = startTy * w + startTx;
  if (isGoal(startTx, startTy)) return [];

  const prev = new Int32Array(w * h).fill(-1);
  const seen = new Uint8Array(w * h);
  seen[start] = 1;

  const queue: number[] = [start];
  let head = 0;
  let goal = -1;

  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % w;
    const cy = (cur / w) | 0;
    for (const d of NEIGHBORS) {
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (seen[ni]) continue;
      if (!isWalkable(map, nx, ny)) continue;
      seen[ni] = 1;
      prev[ni] = cur;
      if (isGoal(nx, ny)) {
        goal = ni;
        head = queue.length; // stop expanding; unwind below
        break;
      }
      queue.push(ni);
    }
    if (goal !== -1) break;
  }

  if (goal === -1) return null;

  const tiles: Array<{ tx: number; ty: number }> = [];
  for (let cur = goal; cur !== start; cur = prev[cur]) {
    if (cur === -1) return null;
    tiles.push({ tx: cur % w, ty: (cur / w) | 0 });
  }
  tiles.reverse();
  return tiles;
}

/**
 * True when the character's hitbox can sweep from a to b without clipping a
 * wall or exhibit. Sampled rather than analytic — cheap at this tile scale and
 * it reuses the same `canStand` test the walk itself is bound by.
 */
function clearLine(
  map: Tilemap,
  ch: Character,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): boolean {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!canStand(map, ax + (bx - ax) * t, ay + (by - ay) * t, ch.w, ch.h)) {
      return false;
    }
  }
  return true;
}

/**
 * String-pulling: collapse the 4-connected grid route into the fewest straight
 * legs that still clear every obstacle. Without this the character walks a
 * visible staircase around corners instead of cutting the diagonal.
 */
function smoothRoute(
  map: Tilemap,
  ch: Character,
  tiles: Array<{ tx: number; ty: number }>,
): Waypoint[] {
  const pts = tiles.map((t) => tileCentre(t.tx, t.ty));
  const out: Waypoint[] = [];
  let fromX = ch.x;
  let fromY = ch.y;
  let i = 0;

  while (i < pts.length) {
    // Reach for the furthest waypoint still in clear line of sight.
    let best = i;
    for (let j = pts.length - 1; j > i; j--) {
      if (clearLine(map, ch, fromX, fromY, pts[j].x, pts[j].y)) {
        best = j;
        break;
      }
    }
    out.push(pts[best]);
    fromX = pts[best].x;
    fromY = pts[best].y;
    i = best + 1;
  }

  return out;
}

/** Stop the walk and release the analog axis back to the other input sources. */
export function cancelNavigation(nav: Navigator, input: InputState): void {
  if (!nav.active) return;
  nav.active = false;
  nav.path = [];
  nav.index = 0;
  nav.marker = null;
  nav.target = null;
  nav.elapsed = 0;
  input.axisX = 0;
  input.axisY = 0;
}

/** Walk to a specific floor tile. Returns false when no route exists. */
export function navigateToTile(
  nav: Navigator,
  map: Tilemap,
  ch: Character,
  tx: number,
  ty: number,
): boolean {
  if (!isWalkable(map, tx, ty)) return false;
  const tiles = findRoute(
    map,
    Math.floor(ch.x / TILE_SIZE),
    Math.floor(ch.y / TILE_SIZE),
    (gx, gy) => gx === tx && gy === ty,
  );
  if (!tiles) return false;

  nav.path = smoothRoute(map, ch, tiles);
  nav.index = 0;
  nav.elapsed = 0;
  nav.target = null;
  nav.marker = tileCentre(tx, ty);
  nav.active = nav.path.length > 0;
  return true;
}

/**
 * Every tile a visitor could stand on to focus this exhibit, paired with the
 * direction they'd be facing. Mirrors `focusedInteractable`: the viewer stands
 * one tile off the footprint and looks at it, and wall-mounted pieces (which
 * carry a `face`) can only be viewed from their one open side.
 *
 * Free-standing exhibits list their "stand below and look up" spots first,
 * which is how the nameplates and the strolling visitors already treat them, so
 * anything picking a single spot gets the natural head-on view.
 */
function viewingSpots(
  it: Interactable,
): Array<{ tx: number; ty: number; facing: Direction }> {
  const spots: Array<{ tx: number; ty: number; facing: Direction }> = [];
  const facings = (
    it.face ? [it.face] : (["up", "down", "left", "right"] as Direction[])
  ) as Direction[];

  for (let dy = 0; dy < it.height; dy++) {
    for (let dx = 0; dx < it.width; dx++) {
      const ex = it.tileX + dx;
      const ey = it.tileY + dy;
      for (const facing of facings) {
        const d = DIR_DELTA[facing];
        // Standing tile sits opposite the look direction from the exhibit tile.
        const sx = ex - d.x;
        const sy = ey - d.y;
        if (occupies(it, sx, sy)) continue;
        spots.push({ tx: sx, ty: sy, facing });
      }
    }
  }
  return spots;
}

/**
 * A single standing spot with a clear head-on view of `it`, or null when the
 * exhibit is walled in. Used to place a visitor who arrived by deep link
 * directly in front of the thing they came to see.
 */
export function exhibitViewpoint(
  it: Interactable,
  map: Tilemap,
): { tileX: number; tileY: number; facing: Direction } | null {
  const spot = viewingSpots(it).find((s) => isWalkable(map, s.tx, s.ty));
  if (!spot) return null;
  return { tileX: spot.tx, tileY: spot.ty, facing: spot.facing };
}

/**
 * Walk to the nearest spot from which `it` can be viewed, then face and open it.
 * Returns false when the exhibit is unreachable.
 */
export function navigateToExhibit(
  nav: Navigator,
  map: Tilemap,
  ch: Character,
  it: Interactable,
): boolean {
  const spots = viewingSpots(it).filter((s) => isWalkable(map, s.tx, s.ty));
  if (spots.length === 0) return false;

  const byTile = new Map<string, Direction>();
  for (const s of spots) byTile.set(`${s.tx},${s.ty}`, s.facing);

  const tiles = findRoute(
    map,
    Math.floor(ch.x / TILE_SIZE),
    Math.floor(ch.y / TILE_SIZE),
    (gx, gy) => byTile.has(`${gx},${gy}`),
  );
  if (!tiles) return false;

  const dest = tiles.length > 0 ? tiles[tiles.length - 1] : null;
  const facing = dest
    ? byTile.get(`${dest.tx},${dest.ty}`)!
    : byTile.get(
        `${Math.floor(ch.x / TILE_SIZE)},${Math.floor(ch.y / TILE_SIZE)}`,
      )!;

  nav.path = smoothRoute(map, ch, tiles);
  nav.index = 0;
  nav.elapsed = 0;
  nav.target = { it, facing };
  nav.marker = {
    x: (it.tileX + it.width / 2) * TILE_SIZE,
    y: (it.tileY + it.height / 2) * TILE_SIZE,
  };

  // Already standing in a viewing spot: turn and open without walking.
  if (nav.path.length === 0) {
    ch.facing = facing;
    nav.active = false;
    nav.marker = null;
    nav.target = null;
    return true;
  }

  nav.active = true;
  return true;
}

/**
 * Advance the walk by one frame. Called before `updateCharacter` so the axis it
 * writes is consumed the same tick. `onArrive` fires once, at the end of a walk
 * that began on an exhibit.
 */
export function steerNavigator(
  nav: Navigator,
  ch: Character,
  input: InputState,
  dt: number,
  onArrive?: (it: Interactable) => void,
): void {
  if (!nav.active) return;

  const wp = nav.path[nav.index];
  if (!wp) {
    finish(nav, ch, input, onArrive);
    return;
  }

  const dx = wp.x - ch.x;
  const dy = wp.y - ch.y;
  const dist = Math.hypot(dx, dy);
  const isLast = nav.index === nav.path.length - 1;

  if (dist > (isLast ? ARRIVE_FINAL : ARRIVE)) {
    nav.elapsed += dt;
    if (nav.elapsed > STALL_SECONDS) {
      cancelNavigation(nav, input);
      return;
    }
    input.axisX = dx / dist;
    input.axisY = dy / dist;
    return;
  }

  nav.index++;
  nav.elapsed = 0;
  if (nav.index >= nav.path.length) finish(nav, ch, input, onArrive);
}

function finish(
  nav: Navigator,
  ch: Character,
  input: InputState,
  onArrive?: (it: Interactable) => void,
): void {
  const target = nav.target;
  nav.active = false;
  nav.path = [];
  nav.index = 0;
  nav.marker = null;
  nav.target = null;
  nav.elapsed = 0;
  input.axisX = 0;
  input.axisY = 0;
  if (target) {
    ch.facing = target.facing;
    onArrive?.(target.it);
  }
}

/**
 * Ring pulsing at the click destination — immediate feedback that the click
 * registered, since the character takes a moment to arrive. Drawn in the floor
 * pass so it reads as painted on the ground.
 */
export function drawNavMarker(
  ctx: CanvasRenderingContext2D,
  nav: Navigator,
  time: number,
  reduced = false,
): void {
  if (!nav.marker) return;
  const pulse = reduced ? 0.6 : 0.45 + 0.35 * Math.sin(time * 5);
  const { x, y } = nav.marker;

  ctx.save();
  ctx.strokeStyle = `rgba(0, 216, 255, ${pulse})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(0, 216, 255, ${pulse * 0.35})`;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 3, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
