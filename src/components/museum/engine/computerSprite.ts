import { TILE_SIZE } from "./tileAtlas";
import { drawText, measureText, PIXEL_FONT_HEIGHT } from "./pixelFont";

const PALETTE = {
  body: "#2a2a30",
  bodyShadow: "#1a1a1e",
  bodyHighlight: "#34343c",
  stand: "#1a1a1e",
  screen: "#050506",
  keyboard: "#1f1f23",
} as const;

const DEFAULT_ACCENT = "#00d8ff";

/** #rrggbb -> rgba() at the given alpha. */
function rgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Scale a hex color toward black — used for the frame's shaded bottom edge. */
function shade(hex: string, factor: number): string {
  const v = hex.replace("#", "");
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  const n = parseInt(full, 16);
  const r = Math.round(((n >> 16) & 255) * factor);
  const g = Math.round(((n >> 8) & 255) * factor);
  const b = Math.round((n & 255) * factor);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Draws a computer-desk sprite spanning `tileW × tileH` tiles at (tx, ty).
 * Sized for a 2x2 footprint — large monitor + desk so the works exhibits read
 * as the headline objects in the room.
 *
 * Each desk carries its work's accent color on the monitor frame and screen,
 * plus the project's initial on the display. With eight desks in one room, that
 * per-project identity is what lets a visitor pick out the one they want from
 * across the Workshop instead of walking up to read every nameplate.
 */
export function drawComputerSprite(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tileW: number,
  tileH: number,
  time = 0,
  phase = 0,
  accent: string = DEFAULT_ACCENT,
  letter = "",
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

  // Screen frame: the work's accent, with a 2px darker shadow on the bottom edge.
  const frameX = x + 10;
  const frameY = y + 4;
  const frameW = w - 20;
  const frameH = deskTop - frameY - 4;
  ctx.fillStyle = shade(accent, 0.55);
  ctx.fillRect(frameX, frameY, frameW, frameH);
  ctx.fillStyle = accent;
  ctx.fillRect(frameX, frameY, frameW, frameH - 2);

  // Inner screen.
  const screenX = frameX + 3;
  const screenY = frameY + 3;
  const screenW = frameW - 6;
  const screenH = frameH - 6;
  ctx.fillStyle = PALETTE.screen;
  ctx.fillRect(screenX, screenY, screenW, screenH);

  // Screen glow band along the top, gently pulsing so each monitor "breathes".
  const pulse = 0.6 + 0.4 * Math.sin(time * 2 + phase);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = rgba(accent, 0.3);
  ctx.fillRect(screenX + 1, screenY + 1, screenW - 2, 4);
  ctx.restore();

  // Project initial on the display — the at-a-glance identifier.
  const glyph = letter.slice(0, 1).toUpperCase();
  if (glyph) {
    const scale = 2;
    const tw = measureText(glyph, scale);
    const th = PIXEL_FONT_HEIGHT * scale;
    ctx.fillStyle = rgba(accent, 0.75);
    drawText(
      ctx,
      glyph,
      Math.round(screenX + screenW / 2 - tw / 2),
      Math.round(screenY + screenH / 2 - th / 2),
      scale,
    );
  }

  // A bright scanline scrolling down the screen for "alive" character.
  const innerH = screenH - 2;
  const scanY = screenY + 1 + Math.floor(((time * 14 + phase * 7) % innerH));
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.7;
  ctx.fillRect(screenX + 2, scanY, screenW - 4, 1);
  ctx.globalAlpha = 1;
}
