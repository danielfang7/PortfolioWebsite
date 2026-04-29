export const TILE_SIZE = 32;

/**
 * Base tile palette. Paintings and computers are sprites drawn over wall/floor
 * tiles (see paintingSprite.ts, computerSprite.ts). Painting footprint tiles
 * are stored as WALL; computer footprint tiles stay FLOOR. Both are marked
 * non-walkable in the scene builder.
 */
export const TILE = {
  FLOOR: 0,
  WALL: 1,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

const PALETTE = {
  floorBase: "#0e0e10",
  floorGrout: "#17171a",
  floorSpeck: "#1f1f23",
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

  drawFloor(ctx, TILE.FLOOR * TILE_SIZE);
  drawWall(ctx, TILE.WALL * TILE_SIZE);

  return atlas;
}

function drawFloor(ctx: CanvasRenderingContext2D, ox: number) {
  ctx.fillStyle = PALETTE.floorBase;
  ctx.fillRect(ox, 0, TILE_SIZE, TILE_SIZE);
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
