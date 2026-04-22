export const TILE_SIZE = 32;

/**
 * Base tile palette. Paintings are no longer tiles — they're rendered as sprites
 * on top of wall tiles (see paintingSprite.ts). Painting footprint tiles are
 * stored as WALL in the tilemap and marked non-walkable.
 */
export const TILE = {
  FLOOR: 0,
  WALL: 1,
  DESK: 2,
} as const;

export type TileId = (typeof TILE)[keyof typeof TILE];

const PALETTE = {
  floorBase: "#0e0e10",
  floorGrout: "#17171a",
  floorSpeck: "#1f1f23",
  wallBase: "#16161a",
  wallTop: "#2a2a30",
  wallShadow: "#050506",
  deskBody: "#2a2a30",
  deskBodyShadow: "#1a1a1e",
  deskScreenFrame: "#00d8ff",
  deskScreen: "#050506",
  deskScreenGlow: "#003845",
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
  drawDesk(ctx, TILE.DESK * TILE_SIZE);

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

function drawDesk(ctx: CanvasRenderingContext2D, ox: number) {
  drawFloor(ctx, ox);
  const bx = ox + 2,
    by = 12,
    bw = TILE_SIZE - 4,
    bh = 18;
  ctx.fillStyle = PALETTE.deskBody;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = PALETTE.deskBodyShadow;
  ctx.fillRect(bx, by + bh - 2, bw, 2);
  const sx = ox + 8,
    sy = 4,
    sw = TILE_SIZE - 16,
    sh = 12;
  ctx.fillStyle = PALETTE.deskScreenFrame;
  ctx.fillRect(sx, sy, sw, sh);
  ctx.fillStyle = PALETTE.deskScreen;
  ctx.fillRect(sx + 1, sy + 1, sw - 2, sh - 2);
  ctx.fillStyle = PALETTE.deskScreenGlow;
  ctx.fillRect(sx + 2, sy + 2, sw - 4, 2);
  ctx.fillStyle = PALETTE.deskBodyShadow;
  ctx.fillRect(ox + TILE_SIZE / 2 - 1, sy + sh, 2, 2);
}
