import { TILE_SIZE } from "./tileAtlas";
import type { Character } from "./character";
import type { Interactable } from "./interactables";

/**
 * Atmospheric render passes for the hall. Split into a "floor" group (drawn
 * after the tilemap but under the sprites) and an "overlay" group (drawn last,
 * over everything) so light reads as sitting in the room rather than painted
 * flat on top of it.
 */

/**
 * A room rectangle (in world tiles) plus the colors that give that wing its
 * identity. The renderer passes one per room so decor and ambient light are
 * drawn per-room rather than once across the whole world.
 */
export type RoomLight = {
  x: number;
  y: number;
  cols: number;
  rows: number;
  floorTint: string;
  ambient: string;
};

/**
 * Static floor decor per room: a baseboard trim where the walls meet the floor
 * and a decorative medallion in the room's centre. Drawn right after the
 * tilemap so ambient light and spotlights fall over it.
 */
export function drawFloorDecor(
  ctx: CanvasRenderingContext2D,
  rooms: RoomLight[],
): void {
  ctx.save();
  for (const room of rooms) {
    const px = room.x * TILE_SIZE;
    const py = room.y * TILE_SIZE;
    const w = room.cols * TILE_SIZE;
    const h = room.rows * TILE_SIZE;

    // Baseboard trim: a thin line just inside the perimeter walls.
    ctx.strokeStyle = "rgba(0, 216, 255, 0.10)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      px + TILE_SIZE + 0.5,
      py + TILE_SIZE + 0.5,
      w - 2 * TILE_SIZE - 1,
      h - 2 * TILE_SIZE - 1,
    );

    // Centre medallion: concentric rings + a soft filled core.
    const cx = px + w / 2;
    const cy = py + h / 2;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    core.addColorStop(0, "rgba(0, 216, 255, 0.05)");
    core.addColorStop(1, "rgba(0, 216, 255, 0)");
    ctx.fillStyle = core;
    ctx.fillRect(cx - 60, cy - 60, 120, 120);

    ctx.strokeStyle = "rgba(0, 216, 255, 0.14)";
    for (const r of [64, 42]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Four cardinal ticks on the inner ring for a compass-rose feel.
    ctx.strokeStyle = "rgba(0, 216, 255, 0.20)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - 48);
    ctx.lineTo(cx, cy - 36);
    ctx.moveTo(cx, cy + 36);
    ctx.lineTo(cx, cy + 48);
    ctx.moveTo(cx - 48, cy);
    ctx.lineTo(cx - 36, cy);
    ctx.moveTo(cx + 36, cy);
    ctx.lineTo(cx + 48, cy);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Per-room ambient: a faint floor wash that color-codes each wing, plus a soft
 * light pool in the room's centre. Gives the Gallery a cool cast and the
 * Workshop a warm one.
 */
export function drawAmbientFloor(
  ctx: CanvasRenderingContext2D,
  rooms: RoomLight[],
): void {
  for (const room of rooms) {
    const px = room.x * TILE_SIZE;
    const py = room.y * TILE_SIZE;
    const w = room.cols * TILE_SIZE;
    const h = room.rows * TILE_SIZE;

    // Faint wash over the whole room floor for wing identity.
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = room.floorTint;
    ctx.fillRect(px, py, w, h);
    ctx.restore();

    // Centre ambient pool.
    const cx = px + w / 2;
    const cy = py + h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
    grad.addColorStop(0, room.ambient);
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, w, h);
  }
}

/**
 * Colored light pools cast from each painting onto the floor in front of it.
 * The pool direction follows which wall the painting hangs on, so the light
 * always spills into the room. Drawn additively for a soft gallery-spotlight
 * feel, tinted by each experiment's accent.
 */
export function drawPaintingSpotlights(
  ctx: CanvasRenderingContext2D,
  paintings: Interactable[],
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of paintings) {
    const color = p.color ?? "#00d8ff";
    // Centre of the painting footprint.
    const cx = (p.tileX + p.width / 2) * TILE_SIZE;
    const cy = (p.tileY + p.height / 2) * TILE_SIZE;
    // Push the light pool ~1.5 tiles into the room based on facing wall.
    const off = TILE_SIZE * 1.6;
    let lx = cx;
    let ly = cy;
    if (p.face === "up") ly = cy + off;
    else if (p.face === "down") ly = cy - off;
    else if (p.face === "left") lx = cx + off;
    else if (p.face === "right") lx = cx - off;

    const r = TILE_SIZE * 2.2;
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, r);
    grad.addColorStop(0, hexToRgba(color, 0.22));
    grad.addColorStop(0.5, hexToRgba(color, 0.08));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
  }
  ctx.restore();
}

/**
 * Accent light pools cast on the floor around each free-standing exhibit — the
 * Portfolio's pedestals and the Workshop's desks. A soft downlight that grounds
 * the object and color-codes it by company or project. Drawn additively in the
 * same floor pass as the painting spotlights.
 */
export function drawFloorSpotlights(
  ctx: CanvasRenderingContext2D,
  exhibits: Interactable[],
  fallback = "#a78bfa",
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of exhibits) {
    const color = p.color ?? fallback;
    const cx = (p.tileX + p.width / 2) * TILE_SIZE;
    // Pool sits at the foot of the pedestal, biased toward the room.
    const cy = (p.tileY + p.height) * TILE_SIZE - TILE_SIZE * 0.4;
    const r = TILE_SIZE * 2;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, hexToRgba(color, 0.2));
    grad.addColorStop(0.5, hexToRgba(color, 0.07));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  ctx.restore();
}

/** Soft cyan glow around the player, sells them as lit in the dark room. */
export function drawPlayerGlow(
  ctx: CanvasRenderingContext2D,
  ch: Character,
): void {
  const r = TILE_SIZE * 2.4;
  const grad = ctx.createRadialGradient(ch.x, ch.y, 0, ch.x, ch.y, r);
  grad.addColorStop(0, "rgba(0, 216, 255, 0.10)");
  grad.addColorStop(1, "rgba(0, 216, 255, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = grad;
  ctx.fillRect(ch.x - r, ch.y - r, r * 2, r * 2);
  ctx.restore();
}

const DUST_COUNT = 22;

/**
 * Slow floating dust motes for depth. Positions are derived deterministically
 * from the index (no RNG needed) and drift upward, wrapping at the top.
 */
export function drawDust(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < DUST_COUNT; i++) {
    // Spread motes across the width using an irrational multiplier so they
    // don't visibly align into a grid.
    const baseX = ((i * 97.13) % w);
    const drift = Math.sin(time * 0.3 + i) * 6;
    const x = (baseX + drift + w) % w;
    const speed = 5 + (i % 5);
    const y = (h - ((time * speed + i * 53) % (h + 20))) % (h + 20);
    const twinkle = 0.15 + 0.15 * (0.5 + 0.5 * Math.sin(time * 1.3 + i * 2));
    ctx.fillStyle = `rgba(180, 220, 235, ${twinkle})`;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.restore();
}

/** Darken the edges of the frame to focus the eye on the room centre. */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
): void {
  const grad = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.32,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72,
  );
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** #rrggbb -> rgba() string at the given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  const n = parseInt(
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v,
    16,
  );
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
