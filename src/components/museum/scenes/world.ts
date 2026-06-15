import { TILE, TILE_SIZE, type TileId } from "../engine/tileAtlas";
import type { Tilemap } from "../engine/tilemap";
import type { Interactable } from "../engine/interactables";

/**
 * The museum world: a row of viewport-sized rooms joined by doorways. Room 0 is
 * the Gallery (front-end experiments hang as paintings on the walls); room 1 is
 * the Workshop (shipped works sit on computer desks). Each room is exactly the
 * size of the visible canvas so the camera can frame one room at a time.
 */

/** Visible viewport in tiles — matches one room and the canvas size. */
export const VIEW_COLS = 14;
export const VIEW_ROWS = 10;

export const ROOM_COLS = VIEW_COLS;
export const ROOM_ROWS = VIEW_ROWS;

export type RoomDef = {
  id: string;
  name: string;
  /** Column where the room's left wall sits, in world tiles. */
  originX: number;
  cols: number;
  rows: number;
  /** Faint floor wash + ambient pool colors that give each wing its identity. */
  floorTint: string;
  ambient: string;
};

export const ROOMS: RoomDef[] = [
  {
    id: "gallery",
    name: "The Gallery",
    originX: 0,
    cols: ROOM_COLS,
    rows: ROOM_ROWS,
    floorTint: "#0b1a2a",
    ambient: "rgba(70, 90, 120, 0.16)",
  },
  {
    id: "workshop",
    name: "The Workshop",
    originX: ROOM_COLS,
    cols: ROOM_COLS,
    rows: ROOM_ROWS,
    floorTint: "#1f1608",
    ambient: "rgba(120, 96, 56, 0.16)",
  },
];

export const WORLD_COLS = ROOMS.reduce((n, r) => n + r.cols, 0);
export const WORLD_ROWS = ROOM_ROWS;

/** Spawn in the centre of the Workshop (works wing), surrounded by the desks,
 * with the doorway back to the Gallery as a discoverable west exit. */
export const WORLD_SPAWN = { tileX: 20, tileY: 5 };

/** Rows kept open in the wall between the two rooms (a 2-tile-tall passage). */
const DOOR_ROWS = [4, 5];

/**
 * A passage between two adjacent rooms, in world pixels. Used by the doorway
 * renderer to draw the arch, the warm light spilling through, and the
 * wayfinding signs that point to each wing.
 */
export type Doorway = {
  /** Left/right pixel edges of the 2-tile-wide opening. */
  leftPx: number;
  rightPx: number;
  /** Top/bottom pixel edges of the opening. */
  topPx: number;
  bottomPx: number;
  /** Pixel x of the wall seam at the centre of the opening. */
  seamPx: number;
  /** Room names on each side — the destinations the signs point toward. */
  leftRoom: string;
  rightRoom: string;
};

/** Doorways between each adjacent room pair, derived from the room layout. */
export const DOORWAYS: Doorway[] = ROOMS.slice(0, -1).map((room, r) => {
  const rightWall = room.originX + room.cols - 1; // gallery's right wall col
  const leftWall = ROOMS[r + 1].originX; // next room's left wall col
  const topRow = Math.min(...DOOR_ROWS);
  const botRow = Math.max(...DOOR_ROWS);
  return {
    leftPx: rightWall * TILE_SIZE,
    rightPx: (leftWall + 1) * TILE_SIZE,
    topPx: topRow * TILE_SIZE,
    bottomPx: (botRow + 1) * TILE_SIZE,
    seamPx: leftWall * TILE_SIZE,
    leftRoom: room.name,
    rightRoom: ROOMS[r + 1].name,
  };
});

/** Pixel x where room `index` begins — used as the camera's snap target. */
export function roomOriginPx(index: number): number {
  return ROOMS[index].originX * TILE_SIZE;
}

/** Which room the given world-pixel x falls in. */
export function roomIndexForX(worldX: number): number {
  const i = Math.floor(worldX / (ROOM_COLS * TILE_SIZE));
  return Math.max(0, Math.min(ROOMS.length - 1, i));
}

/**
 * Builds the world tilemap: a checkerboard marble floor, per-room perimeter
 * walls, doorways carved between adjacent rooms, then the exhibit footprints
 * (paintings rewrite to WALL; desks stay floor but non-walkable).
 */
export function createWorldScene(interactables: Interactable[]): Tilemap {
  const w = WORLD_COLS;
  const h = WORLD_ROWS;
  const tiles: TileId[] = new Array(w * h);
  const walkable: boolean[] = new Array(w * h).fill(true);

  // Marble checkerboard across the whole world.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      tiles[y * w + x] = (x + y) % 2 === 0 ? TILE.FLOOR : TILE.FLOOR_ALT;
    }
  }

  // Per-room perimeter walls.
  for (const room of ROOMS) {
    const x0 = room.originX;
    const x1 = room.originX + room.cols - 1;
    for (let x = x0; x <= x1; x++) {
      for (const y of [0, room.rows - 1]) {
        tiles[y * w + x] = TILE.WALL;
        walkable[y * w + x] = false;
      }
    }
    for (let y = 0; y < room.rows; y++) {
      for (const x of [x0, x1]) {
        tiles[y * w + x] = TILE.WALL;
        walkable[y * w + x] = false;
      }
    }
  }

  // Carve doorways: open the two adjacent wall columns between each room pair.
  for (let r = 0; r < ROOMS.length - 1; r++) {
    const rightWall = ROOMS[r].originX + ROOMS[r].cols - 1;
    const leftWall = ROOMS[r + 1].originX;
    for (const y of DOOR_ROWS) {
      for (const x of [rightWall, leftWall]) {
        tiles[y * w + x] = TILE.FLOOR;
        walkable[y * w + x] = true;
      }
    }
  }

  // Exhibit footprints.
  for (const it of interactables) {
    for (let dy = 0; dy < it.height; dy++) {
      for (let dx = 0; dx < it.width; dx++) {
        const x = it.tileX + dx;
        const y = it.tileY + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        if (it.kind === "painting") tiles[i] = TILE.WALL;
        walkable[i] = false;
      }
    }
  }

  return { width: w, height: h, tiles, walkable };
}
