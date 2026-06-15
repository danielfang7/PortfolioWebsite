/**
 * Tiny 3x5 bitmap font. Drawn with fillRect so it stays crisp under the
 * canvas's `image-rendering: pixelated` upscale — antialiased fillText would
 * smear at this resolution. Uppercase letters, digits, and a few symbols; any
 * unknown char renders as a space. Used for the museum exhibit nameplates.
 */

const GLYPH_W = 3;
const GLYPH_H = 5;

// Each glyph is 5 rows of a 3-char bit string. "1" = filled pixel.
const GLYPHS: Record<string, string[]> = {
  A: ["010", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["011", "100", "100", "100", "011"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["011", "100", "101", "101", "011"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "010"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["010", "101", "101", "101", "010"],
  P: ["110", "101", "110", "100", "100"],
  Q: ["010", "101", "101", "110", "011"],
  R: ["110", "101", "110", "101", "101"],
  S: ["011", "100", "010", "001", "110"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["110", "001", "010", "100", "111"],
  "3": ["111", "001", "011", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "110", "001", "110"],
  "6": ["011", "100", "110", "101", "010"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["010", "101", "010", "101", "010"],
  "9": ["010", "101", "011", "001", "110"],
  "-": ["000", "000", "111", "000", "000"],
  "&": ["010", "101", "010", "101", "011"],
  ".": ["000", "000", "000", "000", "010"],
  ":": ["000", "010", "000", "010", "000"],
  "/": ["001", "001", "010", "100", "100"],
  ">": ["100", "010", "001", "010", "100"],
  "<": ["001", "010", "100", "010", "001"],
};

/** Width in base pixels of `text` at `scale` (1px gap between glyphs). */
export function measureText(text: string, scale = 1): number {
  if (text.length === 0) return 0;
  return (text.length * (GLYPH_W + 1) - 1) * scale;
}

export const PIXEL_FONT_HEIGHT = GLYPH_H;

/**
 * Draws `text` with its top-left at (x, y) in the current fillStyle. Returns the
 * advance width so callers can chain. Coordinates are rounded so glyphs land on
 * whole pixels.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale = 1,
): number {
  const ox = Math.round(x);
  const oy = Math.round(y);
  let cursor = 0;
  for (const ch of text.toUpperCase()) {
    const glyph = GLYPHS[ch];
    if (glyph) {
      for (let row = 0; row < GLYPH_H; row++) {
        const bits = glyph[row];
        for (let col = 0; col < GLYPH_W; col++) {
          if (bits[col] === "1") {
            ctx.fillRect(
              ox + (cursor + col) * scale,
              oy + row * scale,
              scale,
              scale,
            );
          }
        }
      }
    }
    cursor += GLYPH_W + 1;
  }
  return measureText(text, scale);
}
