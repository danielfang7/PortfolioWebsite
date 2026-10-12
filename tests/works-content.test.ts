// Value: protects=every work's images resolve and its order is unique; fails_when=a
// thumbnail/gallery path is missing from public/, a raster has no .webp sibling
// (Picture.astro, the lightbox and the museum always request the .webp first, and
// browsers do not fall back when that source 404s), or two works share an order
// (prev/next and the hero gradient depend on it); why_new=images and order are
// hand-maintained and only a visual check catches them; seam=none (reads the
// content files); no_claim=frontmatter schema validity (astro build checks that).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WORKS_DIR = "src/content/works";
const files = readdirSync(WORKS_DIR).filter((f) => /\.mdx?$/.test(f));
const frontmatter = (file: string) => readFileSync(join(WORKS_DIR, file), "utf8").split(/^---$/m)[1] ?? "";

describe("works content", () => {
  it("finds the works", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s: every image exists with a .webp sibling", (file) => {
    const paths = [...frontmatter(file).matchAll(/["'](\/images\/[^"']+\.(?:png|jpe?g))["']/gi)].map((m) => m[1]);
    for (const src of paths) {
      const raster = join("public", src);
      const webp = raster.replace(/\.(png|jpe?g)$/i, ".webp");
      expect(existsSync(raster), `${file}: missing ${raster}`).toBe(true);
      expect(existsSync(webp), `${file}: missing ${webp}`).toBe(true);
      expect(statSync(webp).size, `${file}: ${webp} is larger than ${raster}`).toBeLessThanOrEqual(statSync(raster).size);
    }
  });

  it("gives every work a unique order", () => {
    const orders = files.map((f) => Number(frontmatter(f).match(/^order:\s*(\d+)\s*$/m)?.[1]));
    expect(orders.every(Number.isFinite), "every work sets an order").toBe(true);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
