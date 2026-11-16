// Value: protects=every work's images and videos resolve and its order is unique;
// fails_when=a thumbnail/gallery/video path is missing from public/ or is not a
// root path (a relative path 404s under /works/<slug>/), a raster has no .webp sibling
// (Picture.astro, the lightbox and the museum always request the .webp first, and
// browsers do not fall back when that source 404s), or two works share an order
// (prev/next and the hero gradient depend on it); why_new=images and order are
// hand-maintained and only a visual check catches them; seam=none (reads the
// content files); no_claim=frontmatter schema validity (astro build checks that).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { drawText } from "../src/components/museum/engine/pixelFont";

type Frontmatter = {
  title: string;
  order?: number;
  thumbnail: string;
  images?: string[];
  videos?: string[];
  media?: { src: string }[];
};

const WORKS_DIR = "src/content/works";
const files = readdirSync(WORKS_DIR).filter((f) => /\.mdx?$/.test(f));
const frontmatter = (file: string) =>
  parse(readFileSync(join(WORKS_DIR, file), "utf8").split(/^---\r?$/m)[1] ?? "") as Frontmatter;

describe("works content", () => {
  it("finds the works", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s: every image and video exists, rasters with a .webp sibling", (file) => {
    const fm = frontmatter(file);
    const paths = [fm.thumbnail, ...(fm.images ?? []), ...(fm.videos ?? []), ...(fm.media ?? []).map((m) => m.src)];
    for (const src of paths) {
      expect(src, `${file}: ${src} must be a root path`).toMatch(/^\//);
      const asset = join("public", src);
      expect(existsSync(asset), `${file}: missing ${asset}`).toBe(true);
      if (!/\.(png|jpe?g)$/i.test(src)) continue;
      const webp = asset.replace(/\.(png|jpe?g)$/i, ".webp");
      expect(existsSync(webp), `${file}: missing ${webp}`).toBe(true);
      expect(statSync(webp).size, `${file}: ${webp} is larger than ${asset}`).toBeLessThanOrEqual(statSync(asset).size);
    }
  });

  it("gives every work a unique order", () => {
    const orders = files.map((f) => frontmatter(f).order);
    expect(orders.every(Number.isFinite), "every work sets an order").toBe(true);
    expect(new Set(orders).size).toBe(orders.length);
  });

  // Value: protects=every work title renders in full on its museum nameplate;
  // fails_when=a title uses a character the pixel font lacks (it draws a blank cell, as
  // "?" in "Food or Friend?" did); why_new=nothing checked titles against the font;
  // seam=none (drawText is what plaque.ts calls); no_claim=how the plate looks on canvas.
  it.each(files)("%s: the museum nameplate font draws every character of the title", (file) => {
    const { title } = frontmatter(file);
    const blank = [...title].filter((ch) => {
      if (ch === " ") return false;
      let pixels = 0;
      const ctx = { fillRect: () => pixels++ } as unknown as CanvasRenderingContext2D;
      drawText(ctx, ch, 0, 0);
      return pixels === 0;
    });
    expect(blank, `${file}: the nameplate would draw these as blank space`).toEqual([]);
  });
});
