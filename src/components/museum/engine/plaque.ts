import { TILE_SIZE } from "./tileAtlas";
import type { Interactable } from "./interactables";
import { drawText, measureText, PIXEL_FONT_HEIGHT } from "./pixelFont";
import { ROOM_COLS } from "../scenes/world";

/**
 * Engraved brass nameplates beneath each exhibit — the small museum label that
 * makes the room read as a curated gallery before the visitor walks up. Text is
 * drawn with the 3x5 pixel font so it stays crisp under the pixelated upscale.
 *
 * Placement follows the exhibit's facing side so the plate always sits on the
 * room-side of the piece: free-standing desks and pedestals (face `null`) get
 * their plate on the floor in front.
 */

const SCALE = 1;
const PAD_X = 3;
const PAD_Y = 2;
const GAP = 3;

const BRASS = "#9c814f";
const BRASS_HI = "#c9ad6e";
const BRASS_SHADOW = "#5f4e2c";
const ENGRAVE = "#241c0d";

/** Top-left corner of the plate for an interactable, given its plate size. */
function plateOrigin(
  it: Interactable,
  w: number,
  h: number,
): { x: number; y: number } {
  const cx = (it.tileX + it.width / 2) * TILE_SIZE;
  const cy = (it.tileY + it.height / 2) * TILE_SIZE;
  const topEdge = it.tileY * TILE_SIZE;
  const bottomEdge = (it.tileY + it.height) * TILE_SIZE;
  const leftEdge = it.tileX * TILE_SIZE;
  const rightEdge = (it.tileX + it.width) * TILE_SIZE;

  // The plate sits on the room-side of the exhibit — where the visitor stands.
  // `face` is the direction the visitor looks to view it, so the artwork hangs
  // on the wall *ahead* of them and the plate goes on the *opposite* side.
  // Desks (face === null) read like a floor exhibit with the plate in front.
  switch (it.face) {
    case "down": // visitor looks down → artwork below them, plate above
      return { x: cx - w / 2, y: topEdge - GAP - h };
    case "left": // visitor looks left → artwork on the left wall, plate to its right
      return { x: rightEdge + GAP, y: cy - h / 2 };
    case "right": // visitor looks right → artwork on the right wall, plate to its left
      return { x: leftEdge - GAP - w, y: cy - h / 2 };
    case "up": // visitor looks up → artwork above them, plate below
    default:
      return { x: cx - w / 2, y: bottomEdge + GAP };
  }
}

const ROOM_W_PX = ROOM_COLS * TILE_SIZE;

/**
 * Keep a plate inside its own room's interior. A long title (whose plate is
 * wider than the exhibit it labels) would otherwise spill over the perimeter
 * wall and collide with the doorway signage in the next wing.
 */
function clampToRoom(x: number, w: number, exhibitCx: number): number {
  const roomLeft = Math.floor(exhibitCx / ROOM_W_PX) * ROOM_W_PX;
  const min = roomLeft + TILE_SIZE + 1;
  const max = roomLeft + ROOM_W_PX - TILE_SIZE - w - 1;
  // A plate too wide for the room centres rather than jumping to one edge.
  if (max < min) return roomLeft + (ROOM_W_PX - w) / 2;
  return Math.max(min, Math.min(x, max));
}

/** Draws the nameplate for a single exhibit. */
export function drawPlaque(
  ctx: CanvasRenderingContext2D,
  it: Interactable,
): void {
  const text = it.title;
  const textW = measureText(text, SCALE);
  const w = textW + PAD_X * 2;
  const h = PIXEL_FONT_HEIGHT * SCALE + PAD_Y * 2;
  const { x, y } = plateOrigin(it, w, h);
  const exhibitCx = (it.tileX + it.width / 2) * TILE_SIZE;
  const px = Math.round(clampToRoom(x, w, exhibitCx));
  const py = Math.round(y);

  // Brass plate with a top highlight and bottom shadow for a beveled look.
  ctx.fillStyle = BRASS_SHADOW;
  ctx.fillRect(px - 1, py - 1, w + 2, h + 2);
  ctx.fillStyle = BRASS;
  ctx.fillRect(px, py, w, h);
  ctx.fillStyle = BRASS_HI;
  ctx.fillRect(px, py, w, 1);
  ctx.fillStyle = BRASS_SHADOW;
  ctx.fillRect(px, py + h - 1, w, 1);

  // Engraved title.
  ctx.fillStyle = ENGRAVE;
  drawText(ctx, text, px + PAD_X, py + PAD_Y, SCALE);
}

/** Draws nameplates for every exhibit. */
export function drawPlaques(
  ctx: CanvasRenderingContext2D,
  interactables: Interactable[],
): void {
  for (const it of interactables) drawPlaque(ctx, it);
}
