import { TILE_SIZE } from "./tileAtlas";
import { drawText, measureText, PIXEL_FONT_HEIGHT } from "./pixelFont";

/**
 * A lit stone pedestal carrying a framed "portfolio plaque" — the Portfolio
 * wing's counterpart to the Workshop's desks. The
 * plinth is drawn in neutral marble so the accent-tinted plaque (with the
 * company's initial) reads as the highlighted object, color-coded per company.
 * Sized for a 2x2 footprint to match the desks as a headline exhibit.
 */

const STONE = {
  base: "#2b2b33",
  highlight: "#3b3b45",
  shadow: "#191920",
  edge: "#0f0f14",
} as const;

const PLAQUE_BG = "#070709";

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

export function drawInvestmentSprite(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  tileW: number,
  tileH: number,
  accent: string,
  letter: string,
  time = 0,
  phase = 0,
): void {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  const w = tileW * TILE_SIZE;
  const h = tileH * TILE_SIZE;

  const cx = x + w / 2;
  const baseY = y + h - 6;

  // ── Plinth ────────────────────────────────────────────────────────────────
  // Base slab (widest), column, and cap, stacked with a bevelled stone look.
  const slab = { x: x + 12, y: baseY - 6, w: w - 24, h: 7 };
  const col = { x: x + 19, y: y + 32, w: w - 38, h: baseY - 6 - (y + 32) };
  const cap = { x: x + 15, y: y + 27, w: w - 30, h: 6 };

  ctx.fillStyle = STONE.edge;
  ctx.fillRect(slab.x - 1, slab.y - 1, slab.w + 2, slab.h + 2);

  for (const r of [col, slab, cap]) {
    ctx.fillStyle = STONE.base;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = STONE.highlight;
    ctx.fillRect(r.x, r.y, r.w, 2);
    ctx.fillStyle = STONE.shadow;
    ctx.fillRect(r.x, r.y + r.h - 2, r.w, 2);
  }
  // Accent inlay line along the cap so each plinth carries its company color.
  ctx.fillStyle = rgba(accent, 0.85);
  ctx.fillRect(cap.x + 2, cap.y + cap.h - 2, cap.w - 4, 1);

  // ── Framed plaque ───────────────────────────────────────────────────────
  // The display panel standing on the cap: accent frame, dark face, the
  // company initial, and a gently pulsing inner glow so it "breathes".
  const fr = { x: x + 18, y: y + 4, w: w - 36, h: 24 };
  ctx.fillStyle = rgba(accent, 0.45);
  ctx.fillRect(fr.x, fr.y, fr.w, fr.h); // soft outer shadow
  ctx.fillStyle = accent;
  ctx.fillRect(fr.x + 1, fr.y + 1, fr.w - 2, fr.h - 3);

  const face = { x: fr.x + 3, y: fr.y + 3, w: fr.w - 6, h: fr.h - 7 };
  ctx.fillStyle = PLAQUE_BG;
  ctx.fillRect(face.x, face.y, face.w, face.h);

  const pulse = 0.45 + 0.4 * Math.sin(time * 2 + phase);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = rgba(accent, 0.5);
  ctx.fillRect(face.x, face.y, face.w, 3);
  ctx.restore();

  // Company initial, centred on the plaque face in the pixel font (scale 2).
  const glyph = (letter || "?").slice(0, 1).toUpperCase();
  const scale = 2;
  const tw = measureText(glyph, scale);
  const thh = PIXEL_FONT_HEIGHT * scale;
  ctx.fillStyle = "#f2f6f8";
  drawText(
    ctx,
    glyph,
    Math.round(face.x + face.w / 2 - tw / 2),
    Math.round(face.y + face.h / 2 - thh / 2),
    scale,
  );

  // Faint accent uplight licking the underside of the plaque.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(cx, fr.y + fr.h, 0, cx, fr.y + fr.h, 16);
  g.addColorStop(0, rgba(accent, 0.18 + 0.1 * pulse));
  g.addColorStop(1, rgba(accent, 0));
  ctx.fillStyle = g;
  ctx.fillRect(cx - 16, fr.y + fr.h - 16, 32, 32);
  ctx.restore();
}
