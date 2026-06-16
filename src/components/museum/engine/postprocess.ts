/**
 * CRT post-processing overlay drawn as the final pass over the whole scene.
 * Sells the retro-arcade identity: baked horizontal scanlines (cached to an
 * offscreen canvas so it's one cheap drawImage per frame), a slow rolling
 * refresh band, and a faint flicker. No per-pixel work — all composited.
 */

export type CRT = {
  draw: (
    ctx: CanvasRenderingContext2D,
    time: number,
    reduced?: boolean,
  ) => void;
};

export function createCRT(width: number, height: number): CRT {
  // Pre-render the scanline mask once: a dark 1px line every 2 rows.
  const lines = document.createElement("canvas");
  lines.width = width;
  lines.height = height;
  const lctx = lines.getContext("2d");
  if (lctx) {
    lctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    for (let y = 0; y < height; y += 2) {
      lctx.fillRect(0, y, width, 1);
    }
  }

  return {
    draw: (ctx, time, reduced = false) => {
      ctx.save();

      // Scanlines with a subtle mains-hum flicker on their strength. Under
      // reduced-motion the lines stay (they're a static texture) but the
      // flicker is pinned and the rolling band is dropped entirely.
      const flicker = reduced ? 1 : 0.9 + 0.1 * Math.sin(time * 11);
      ctx.globalAlpha = flicker;
      ctx.drawImage(lines, 0, 0);
      ctx.globalAlpha = 1;

      if (reduced) {
        ctx.restore();
        return;
      }

      // Rolling refresh band: a soft bright sweep travelling down the screen.
      const bandH = height * 0.32;
      const y = ((time * 60) % (height + bandH)) - bandH;
      const grad = ctx.createLinearGradient(0, y, 0, y + bandH);
      grad.addColorStop(0, "rgba(255, 255, 255, 0)");
      grad.addColorStop(0.5, "rgba(180, 230, 245, 0.035)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, width, bandH);

      ctx.restore();
    },
  };
}
