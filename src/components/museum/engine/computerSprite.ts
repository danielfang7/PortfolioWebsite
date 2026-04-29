import { TILE_SIZE } from "./tileAtlas";

const PALETTE = {
  body: "#2a2a30",
  bodyShadow: "#1a1a1e",
  bodyHighlight: "#34343c",
  stand: "#1a1a1e",
  frameShadow: "#0891a6",
  frame: "#00d8ff",
  screen: "#050506",
  screenGlow: "#003845",
  screenScanline: "#00d8ff",
  keyboard: "#1f1f23",
} as const;

/**
 * Draws a computer-desk sprite spanning `tileW × tileH` tiles at (tx, ty).
 * Sized for a 2x2 footprint — large monitor + desk so the works exhibits read
 * as the headline objects in the room.
 */
export function drawComputerSprite(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tileW: number,
  tileH: number,
): void {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  const w = tileW * TILE_SIZE;
  const h = tileH * TILE_SIZE;

  const deskTop = y + h - 24;
  const deskHeight = 20;
  const deskX = x + 4;
  const deskW = w - 8;

  ctx.fillStyle = PALETTE.body;
  ctx.fillRect(deskX, deskTop, deskW, deskHeight);
  ctx.fillStyle = PALETTE.bodyHighlight;
  ctx.fillRect(deskX, deskTop, deskW, 2);
  ctx.fillStyle = PALETTE.bodyShadow;
  ctx.fillRect(deskX, deskTop + deskHeight - 2, deskW, 2);

  // Keyboard hint on the desk surface.
  ctx.fillStyle = PALETTE.keyboard;
  ctx.fillRect(x + w / 2 - 10, deskTop + 6, 20, 4);

  // Monitor stand bridging desk to screen.
  const standCx = x + w / 2;
  ctx.fillStyle = PALETTE.stand;
  ctx.fillRect(standCx - 3, deskTop - 4, 6, 4);

  // Screen frame: cyan with a 2px darker shadow on the bottom edge.
  const frameX = x + 10;
  const frameY = y + 4;
  const frameW = w - 20;
  const frameH = deskTop - frameY - 4;
  ctx.fillStyle = PALETTE.frameShadow;
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.fillStyle = PALETTE.frame;
  ctx.fillRect(frameX, frameY, frameW, frameH - 2);

  // Inner screen.
  const screenX = frameX + 3;
  const screenY = frameY + 3;
  const screenW = frameW - 6;
  const screenH = frameH - 6;
  ctx.fillStyle = PALETTE.screen;
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // Screen glow band along the top.
  ctx.fillStyle = PALETTE.screenGlow;
  ctx.fillRect(screenX + 1, screenY + 1, screenW - 2, 4);

  // A single bright scanline near the middle for "alive" character.
  ctx.fillStyle = PALETTE.screenScanline;
  ctx.fillRect(
    screenX + 3,
    screenY + Math.floor(screenH / 2),
    screenW - 6,
    1,
  );
}
