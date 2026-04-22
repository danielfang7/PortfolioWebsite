import { TILE_SIZE } from "./tileAtlas";

/** Painting frame thickness in base pixels, applied to all four sides. */
export const FRAME_THICKNESS = 6;

/**
 * Draws a painting frame spanning `tileW × tileH` tiles at (tx, ty). The inner
 * area is left as a solid dark rectangle; the live experiment preview (when
 * active) is placed on top via a DOM overlay positioned on the same inner rect.
 * Pass `color` (the experiment's accent) to tint the inner area so each
 * painting has distinct identity even when no live preview is mounted.
 */
export function drawPaintingSprite(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tileW: number,
  tileH: number,
  color: string | null,
): void {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  const w = tileW * TILE_SIZE;
  const h = tileH * TILE_SIZE;
  const t = FRAME_THICKNESS;

  // Outer shadow (2px darker cyan).
  ctx.fillStyle = "#0891a6";
  ctx.fillRect(x, y, w, 2);
  ctx.fillRect(x, y + h - 2, w, 2);
  ctx.fillRect(x, y + 2, 2, h - 4);
  ctx.fillRect(x + w - 2, y + 2, 2, h - 4);

  // Bright cyan frame.
  ctx.fillStyle = "#00d8ff";
  ctx.fillRect(x + 2, y + 2, w - 4, t - 2);
  ctx.fillRect(x + 2, y + h - t, w - 4, t - 2);
  ctx.fillRect(x + 2, y + t - 2, t - 2, h - 2 * (t - 2) - 4);
  ctx.fillRect(x + w - t, y + t - 2, t - 2, h - 2 * (t - 2) - 4);

  // Inner canvas area — dark base, tinted by the experiment's color if provided.
  const ix = x + t;
  const iy = y + t;
  const iw = w - 2 * t;
  const ih = h - 2 * t;
  ctx.fillStyle = "#050506";
  ctx.fillRect(ix, iy, iw, ih);
  if (color) {
    // Subtle tint so each painting is color-coded even when no live preview runs.
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = color;
    ctx.fillRect(ix, iy, iw, ih);
    ctx.restore();
  }
}

/**
 * Returns the inner canvas rect (base pixel coords) for a painting at tile
 * (tx, ty) spanning tileW × tileH tiles. Used to position the live-preview
 * DOM overlay.
 */
export function paintingInnerRect(
  tx: number,
  ty: number,
  tileW: number,
  tileH: number,
): { x: number; y: number; w: number; h: number } {
  return {
    x: tx * TILE_SIZE + FRAME_THICKNESS,
    y: ty * TILE_SIZE + FRAME_THICKNESS,
    w: tileW * TILE_SIZE - 2 * FRAME_THICKNESS,
    h: tileH * TILE_SIZE - 2 * FRAME_THICKNESS,
  };
}
