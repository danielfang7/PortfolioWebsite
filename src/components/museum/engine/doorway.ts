import type { Doorway } from "../scenes/world";
import { drawText, measureText, PIXEL_FONT_HEIGHT } from "./pixelFont";

/**
 * Renders the passages between rooms so they read clearly as doorways rather
 * than gaps in the wall: a carved stone arch around the opening, warm light
 * spilling through onto the floor, and a hanging brass sign on each side that
 * points the visitor toward the next wing.
 */

const STONE = "#23232a";
const STONE_HI = "#3a3a44";
const STONE_SHADOW = "#050506";
const GLOW = "255, 232, 196"; // warm light from the room beyond

const BRASS = "#9c814f";
const BRASS_HI = "#c9ad6e";
const BRASS_SHADOW = "#5f4e2c";
const ENGRAVE = "#241c0d";

const SIGN_SCALE = 1; // small wayfinding plate, sized to clear the desks
const SIGN_PAD_X = 4;
const SIGN_PAD_Y = 3;
const POST = 4; // arch jamb/lintel thickness

/** Strip the leading "The " so the wayfinding signs stay short and punchy. */
function signLabel(roomName: string): string {
  return roomName.replace(/^The\s+/i, "");
}

/** Arch + light spill — drawn on the wall/floor layer, behind the actors. */
export function drawDoorways(
  ctx: CanvasRenderingContext2D,
  doorways: Doorway[],
  timeSec: number,
  reduced = false,
): void {
  for (const d of doorways) drawDoorwayArch(ctx, d, timeSec, reduced);
}

/** Hanging wayfinding signs — drawn after the actors so a desk never clips the
 * text. The signs read as overhead signage hung at the doorway plane. */
export function drawDoorwaySigns(
  ctx: CanvasRenderingContext2D,
  doorways: Doorway[],
): void {
  for (const d of doorways) {
    const signY = d.topPx - POST - 17;
    drawSign(ctx, `${signLabel(d.rightRoom)} >`, d.seamPx, signY, "right");
    drawSign(ctx, `< ${signLabel(d.leftRoom)}`, d.seamPx, signY, "left");
  }
}

function drawDoorwayArch(
  ctx: CanvasRenderingContext2D,
  d: Doorway,
  timeSec: number,
  reduced = false,
): void {
  const w = d.rightPx - d.leftPx;
  const h = d.bottomPx - d.topPx;
  const cx = (d.leftPx + d.rightPx) / 2;
  const cy = (d.topPx + d.bottomPx) / 2;

  // Warm light spilling through onto the floor, breathing gently so the eye
  // catches the opening even across the room — held steady under reduced-motion.
  const pulse = reduced ? 0.6 : 0.5 + 0.18 * Math.sin(timeSec * 1.6);
  const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, w * 1.7);
  glow.addColorStop(0, `rgba(${GLOW}, ${0.22 * pulse + 0.12})`);
  glow.addColorStop(1, `rgba(${GLOW}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(cx - w * 1.7, cy - h * 1.5, w * 3.4, h * 3);

  // Threshold wash across the passage floor.
  ctx.fillStyle = `rgba(${GLOW}, 0.1)`;
  ctx.fillRect(d.leftPx + 2, d.topPx, w - 4, h);

  // Stone arch: jambs down each side and a lintel across the top, beveled with
  // a highlight edge so it reads as carved masonry framing the opening.
  // Left jamb.
  ctx.fillStyle = STONE_SHADOW;
  ctx.fillRect(d.leftPx - 1, d.topPx - POST, POST + 1, h + POST);
  ctx.fillStyle = STONE;
  ctx.fillRect(d.leftPx, d.topPx - POST, POST, h + POST);
  ctx.fillStyle = STONE_HI;
  ctx.fillRect(d.leftPx, d.topPx - POST, 1, h + POST);
  // Right jamb.
  ctx.fillStyle = STONE_SHADOW;
  ctx.fillRect(d.rightPx, d.topPx - POST, POST + 1, h + POST);
  ctx.fillStyle = STONE;
  ctx.fillRect(d.rightPx - POST, d.topPx - POST, POST, h + POST);
  ctx.fillStyle = STONE_HI;
  ctx.fillRect(d.rightPx - 1, d.topPx - POST, 1, h + POST);
  // Lintel across the top.
  ctx.fillStyle = STONE_SHADOW;
  ctx.fillRect(d.leftPx - 1, d.topPx - POST - 1, w + 2, POST + 1);
  ctx.fillStyle = STONE;
  ctx.fillRect(d.leftPx, d.topPx - POST, w, POST);
  ctx.fillStyle = STONE_HI;
  ctx.fillRect(d.leftPx, d.topPx - POST, w, 1);
}

/**
 * Draws a small brass wayfinding plate hanging from two chains. `anchorX` is the
 * edge nearest the doorway; `align` says which side of it the plate extends to.
 */
function drawSign(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  y: number,
  align: "left" | "right",
): void {
  const tw = measureText(text, SIGN_SCALE);
  const w = tw + SIGN_PAD_X * 2;
  const h = PIXEL_FONT_HEIGHT * SIGN_SCALE + SIGN_PAD_Y * 2;
  const sx = Math.round(align === "right" ? anchorX - w : anchorX);
  const sy = Math.round(y);

  // Chains anchoring the plate to the lintel above.
  ctx.fillStyle = BRASS_SHADOW;
  ctx.fillRect(sx + 4, sy - 5, 1, 5);
  ctx.fillRect(sx + w - 5, sy - 5, 1, 5);

  // Beveled brass plate.
  ctx.fillStyle = BRASS_SHADOW;
  ctx.fillRect(sx - 1, sy - 1, w + 2, h + 2);
  ctx.fillStyle = BRASS;
  ctx.fillRect(sx, sy, w, h);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(sx, sy, w, 1);
  ctx.fillStyle = BRASS_SHADOW;
  ctx.fillRect(sx, sy + h - 1, w, 1);

  // Engraved label.
  ctx.fillStyle = ENGRAVE;
  drawText(ctx, text, sx + SIGN_PAD_X, sy + SIGN_PAD_Y, SIGN_SCALE);
}
