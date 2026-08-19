import { TILE, TILE_SIZE, type TileId } from "../engine/tileAtlas";
import type { Tilemap } from "../engine/tilemap";
import type { Direction } from "../engine/character";
import type { Interactable, InteractableKind } from "../engine/interactables";

/**
 * The museum world: a row of viewport-sized rooms joined by doorways, generated
 * from the exhibits that need housing rather than hand-placed.
 *
 * A *wing* is a themed stretch of the museum devoted to one kind of exhibit —
 * the Workshop sits works on computer desks, the Portfolio stands investments
 * on lit pedestals. A wing occupies as many rooms as its exhibits need, so
 * adding a ninth work grows the Workshop into a second room instead of
 * silently dropping the overflow.
 *
 * Every room is exactly the size of the visible canvas, which is what lets the
 * camera frame one room at a time and lets canvas-anchored DOM overlays get by
 * with a fixed per-room offset.
 */

/** Visible viewport in tiles — matches one room and the canvas size. */
export const VIEW_COLS = 14;
export const VIEW_ROWS = 10;

export const ROOM_COLS = VIEW_COLS;
export const ROOM_ROWS = VIEW_ROWS;

/** Rows kept open through the wall between rooms — the museum's central lane. */
const DOOR_ROWS = [Math.floor(ROOM_ROWS / 2) - 1, Math.floor(ROOM_ROWS / 2)];

/** The walkable corridor row that runs unbroken through every room. */
export const LANE_ROW = DOOR_ROWS[1];

export type Wing = {
  id: string;
  name: string;
  kind: InteractableKind;
  /** Faint floor wash + ambient pool colors that give the wing its identity. */
  floorTint: string;
  ambient: string;
};

export const WINGS: Wing[] = [
  {
    id: "workshop",
    name: "The Workshop",
    kind: "computer",
    floorTint: "#1f1608",
    ambient: "rgba(120, 96, 56, 0.16)",
  },
  {
    id: "portfolio",
    name: "The Portfolio",
    kind: "investment",
    floorTint: "#1a1226",
    ambient: "rgba(124, 92, 156, 0.16)",
  },
];

export type RoomDef = {
  id: string;
  name: string;
  /** Column where the room's left wall sits, in world tiles. */
  originX: number;
  cols: number;
  rows: number;
  floorTint: string;
  ambient: string;
  wing: Wing;
  /** Index into the wing's exhibit list where this room's exhibits begin. */
  offset: number;
  /** How many of the wing's exhibits this room holds. */
  count: number;
};

/** How an exhibit of a given kind occupies the floor or wall. */
type Footprint = {
  /** Tiles wide, and the gap in tiles kept between neighbours. */
  span: number;
  gap: number;
  width: number;
  height: number;
};

const FOOTPRINTS: Record<InteractableKind, Footprint> = {
  // Floor-standing 2x2 desks, packed tight enough for four across.
  computer: { span: 2, gap: 1, width: 2, height: 2 },
  // Floor-standing 2x2 plinths, given more air so each reads as a monument.
  investment: { span: 2, gap: 2, width: 2, height: 2 },
};

/** Interior width of a room in tiles, excluding the perimeter walls. */
function interiorCols(cols: number): number {
  return cols - 2;
}

/** How many exhibits of one kind fit in a single band across a room. */
function perBand(kind: InteractableKind, cols = ROOM_COLS): number {
  const { span, gap } = FOOTPRINTS[kind];
  return Math.max(1, Math.floor((interiorCols(cols) + gap) / (span + gap)));
}

/** Exhibits of one kind that a single room can hold, across both bands. */
export function roomCapacity(kind: InteractableKind): number {
  return perBand(kind) * 2;
}

/**
 * Start columns for `k` exhibits laid out in one band, centred in the room. A
 * partially filled band stays centred rather than hugging the left wall, so a
 * room holding three of a possible four still looks composed.
 */
function bandColumns(room: RoomDef, k: number): number[] {
  const { span, gap } = FOOTPRINTS[room.wing.kind];
  const used = k * span + Math.max(0, k - 1) * gap;
  const start =
    room.originX + 1 + Math.floor((interiorCols(room.cols) - used) / 2);
  return Array.from({ length: k }, (_, i) => start + i * (span + gap));
}

export type Slot = {
  tileX: number;
  tileY: number;
  width: number;
  height: number;
  face: Direction | null;
};

/**
 * Exactly `room.count` exhibit slots, split across the room's two bands. The
 * front band takes the extra when the count is odd, so the room fills evenly
 * instead of stacking everything along one wall.
 */
export function slotsForRoom(room: RoomDef): Slot[] {
  const n = room.count;
  if (n <= 0) return [];
  const cap = perBand(room.wing.kind, room.cols);
  const first = Math.min(cap, Math.ceil(n / 2));
  const second = Math.min(cap, n - first);
  const { width, height } = FOOTPRINTS[room.wing.kind];

  // Band rows: desks push right up against the top and bottom walls, plinths
  // sit a tile further into the room. Both leave the central lane clear, and
  // both are approachable from any side (`face: null`).
  const rows: Array<{ row: number; face: Direction | null }> =
    room.wing.kind === "computer"
      ? [
          { row: 1, face: null },
          { row: room.rows - 3, face: null },
        ]
      : [
          { row: 2, face: null },
          { row: room.rows - 4, face: null },
        ];

  const slots: Slot[] = [];
  [first, second].forEach((k, band) => {
    for (const tileX of bandColumns(room, k)) {
      slots.push({
        tileX,
        tileY: rows[band].row,
        width,
        height,
        face: rows[band].face,
      });
    }
  });
  return slots;
}

/** Roman suffixes for the second and later rooms of a wing. */
const NUMERALS = ["", " II", " III", " IV", " V", " VI", " VII", " VIII"];

function roomName(wing: Wing, index: number, total: number): string {
  if (total <= 1) return wing.name;
  return wing.name + (NUMERALS[index] ?? ` ${index + 1}`);
}

/**
 * Lays the museum out from exhibit counts: each wing claims the rooms it needs,
 * placed left to right in wing order. Exhibits are spread evenly across a
 * wing's rooms, so nine works read as two rooms of five and four rather than a
 * full room followed by a nearly empty one.
 */
export function planRooms(counts: Partial<Record<InteractableKind, number>>): RoomDef[] {
  const rooms: RoomDef[] = [];
  let originX = 0;

  for (const wing of WINGS) {
    const total = counts[wing.kind] ?? 0;
    const roomCount = Math.max(1, Math.ceil(total / roomCapacity(wing.kind)));
    const base = Math.floor(total / roomCount);
    const extra = total % roomCount;
    let offset = 0;

    for (let i = 0; i < roomCount; i++) {
      const count = base + (i < extra ? 1 : 0);
      rooms.push({
        id: roomCount > 1 ? `${wing.id}-${i + 1}` : wing.id,
        name: roomName(wing, i, roomCount),
        originX,
        cols: ROOM_COLS,
        rows: ROOM_ROWS,
        floorTint: wing.floorTint,
        ambient: wing.ambient,
        wing,
        offset,
        count,
      });
      offset += count;
      originX += ROOM_COLS;
    }
  }

  return rooms;
}

export function worldCols(rooms: RoomDef[]): number {
  return rooms.reduce((n, r) => n + r.cols, 0);
}

/** Spawn in the middle of the first Workshop room, on the through-lane. */
export function spawnTile(rooms: RoomDef[]): { tileX: number; tileY: number } {
  const home =
    rooms.find((r) => r.wing.kind === "computer") ?? rooms[0] ?? null;
  if (!home) return { tileX: 1, tileY: LANE_ROW };
  return {
    tileX: home.originX + Math.floor(home.cols / 2),
    tileY: LANE_ROW,
  };
}

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
export function buildDoorways(rooms: RoomDef[]): Doorway[] {
  return rooms.slice(0, -1).map((room, r) => {
    const rightWall = room.originX + room.cols - 1;
    const leftWall = rooms[r + 1].originX;
    const topRow = Math.min(...DOOR_ROWS);
    const botRow = Math.max(...DOOR_ROWS);
    return {
      leftPx: rightWall * TILE_SIZE,
      rightPx: (leftWall + 1) * TILE_SIZE,
      topPx: topRow * TILE_SIZE,
      bottomPx: (botRow + 1) * TILE_SIZE,
      seamPx: leftWall * TILE_SIZE,
      leftRoom: room.name,
      rightRoom: rooms[r + 1].name,
    };
  });
}

/** Pixel x where room `index` begins — used as the camera's snap target. */
export function roomOriginPx(rooms: RoomDef[], index: number): number {
  const clamped = Math.max(0, Math.min(rooms.length - 1, index));
  return rooms[clamped].originX * TILE_SIZE;
}

/** Which room the given world-pixel x falls in. */
export function roomIndexForX(rooms: RoomDef[], worldX: number): number {
  const i = Math.floor(worldX / (ROOM_COLS * TILE_SIZE));
  return Math.max(0, Math.min(rooms.length - 1, i));
}

/**
 * Builds the world tilemap: a checkerboard marble floor, per-room perimeter
 * walls, doorways carved between adjacent rooms, then the exhibit footprints
 * (desks and pedestals stay floor tiles but are non-walkable).
 */
export function createWorldScene(
  rooms: RoomDef[],
  interactables: Interactable[],
): Tilemap {
  const w = worldCols(rooms);
  const h = ROOM_ROWS;
  const tiles: TileId[] = new Array(w * h);
  const walkable: boolean[] = new Array(w * h).fill(true);

  // Marble checkerboard across the whole world.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      tiles[y * w + x] = (x + y) % 2 === 0 ? TILE.FLOOR : TILE.FLOOR_ALT;
    }
  }

  // Per-room perimeter walls.
  for (const room of rooms) {
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
  for (let r = 0; r < rooms.length - 1; r++) {
    const rightWall = rooms[r].originX + rooms[r].cols - 1;
    const leftWall = rooms[r + 1].originX;
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
        walkable[y * w + x] = false;
      }
    }
  }

  return { width: w, height: h, tiles, walkable };
}
