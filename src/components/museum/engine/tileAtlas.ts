export const TILE_SIZE = 32;

/**
 * Base tile palette. Paintings and computers are sprites drawn over wall/floor
 * tiles (see paintingSprite.ts, computerSprite.ts). Painting footprint tiles
 * are stored as WALL; computer footprint tiles stay FLOOR. Both are marked
 * non-walkable in the scene builder. FLOOR/FLOOR_ALT alternate in a
 * checkerboard for a polished gallery-marble look.
 */
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  FLOOR_ALT: 2,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

const PALETTE = {
  floorBase: "#0e0e10",
  floorAlt: "#131316",
  floorSheen: "#1a1a1f",
  floorGrout: "#070708",
  floorSpeck: "#202026",
  wallBase: "#16161a",
  wallTop: "#2a2a30",
  wallShadow: "#050506",
} as const;

export function createTileAtlas(): HTMLCanvasElement {
  const tileCount = Object.keys(TILE).length;
  const atlas = document.createElement("canvas");
  atlas.width = TILE_SIZE * tileCount;
  atlas.height = TILE_SIZE;
  const ctx = atlas.getContext("2d");
  if (!ctx) throw new Error("tileAtlas: 2d context unavailable");
  ctx.imageSmoothingEnabled = false;

  drawFloor(ctx, TILE.FLOOR * TILE_SIZE, PALETTE.floorBase);
  drawWall(ctx, TILE.WALL * TILE_SIZE);
  drawFloor(ctx, TILE.FLOOR_ALT * TILE_SIZE, PALETTE.floorAlt);

  return atlas;
}

function drawFloor(ctx: CanvasRenderingContext2D, ox: number, base: string) {
  ctx.fillStyle = base;
  ctx.fillRect(ox, 0, TILE_SIZE, TILE_SIZE);

  // Faint diagonal sheen across the polished surface.
  ctx.fillStyle = PALETTE.floorSheen;
  ctx.fillRect(ox + 4, 4, 2, 2);
  ctx.fillRect(ox + 22, 12, 2, 2);
  ctx.fillRect(ox + 12, 22, 2, 2);

  // Inset grout lines on the bottom/right edges read as tile seams.
  ctx.fillStyle = PALETTE.floorGrout;
  ctx.fillRect(ox, TILE_SIZE - 1, TILE_SIZE, 1);
  ctx.fillRect(ox + TILE_SIZE - 1, 0, 1, TILE_SIZE);

  ctx.fillStyle = PALETTE.floorSpeck;
  ctx.fillRect(ox + 6, 9, 1, 1);
  ctx.fillRect(ox + 20, 18, 1, 1);
  ctx.fillRect(ox + 13, 25, 1, 1);
}

function drawWall(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.fillStyle = PALETTE.wallBase;
  ctx.fillRect(ox, 0, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(ox, 0, TILE_SIZE, 4);
  ctx.fillStyle = PALETTE.wallShadow;
  ctx.fillRect(ox, TILE_SIZE - 2, TILE_SIZE, 2);
  ctx.fillRect(ox + TILE_SIZE / 2, 4, 1, TILE_SIZE - 6);
}
