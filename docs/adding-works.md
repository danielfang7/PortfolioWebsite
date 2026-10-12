# Adding a New Work / Project

This guide walks through everything needed to add a new project to the Works carousel and archive grid.

---

## Overview

Each project is a single Markdown (`.md`) or MDX (`.mdx`) file in `src/content/works/`. Astro's content collection picks it up automatically — no component edits or imports required.

The file drives two places on the site:

| Location | URL | Source |
|---|---|---|
| Works carousel (hero) | `/` and `/works` | `src/components/WorksCarousel.astro` |
| Full archive grid | `/works` | `src/pages/works/index.astro` |
| Project detail page | `/works/<slug>` | `src/pages/works/[slug].astro` |

---

## Step 1 — Add a thumbnail image

Place the project's thumbnail in:

```
public/images/works/<your-image-name>.png   (or .jpg)
public/images/works/<your-image-name>.webp
```

`public/` is the static assets root. Anything inside it is served at `/` — so `public/images/works/gladekit.png` becomes `/images/works/gladekit.png` in the browser.

Every PNG or JPG needs a `.webp` sibling with the same base name. `Picture.astro` and the gallery lightbox swap the extension and serve the WebP first, with the PNG/JPG as the fallback, and nothing in the build creates the WebP for you. Reference the PNG/JPG path in frontmatter, never the `.webp`.

`npm test` checks these rules for every work (`tests/works-content.test.ts`): each `thumbnail`, `images`, `videos` and `media` path starts with `/` (a relative path 404s under `/works/<slug>/`) and exists under `public/`, and each PNG/JPG has a `.webp` sibling no larger than itself.

**Recommended:** square or 16:9 image, at least 800×800 px.

---

## Step 2 — Create the Markdown file

Create a new file at:

```
src/content/works/<slug>.md
```

The filename becomes the URL slug. `gladekit.md` → `/works/gladekit`.

Use `<slug>.mdx` instead when the write-up embeds React components (see `pokelit.mdx` and `paaw.mdx`). Put the `import` lines right after the closing `---` of the frontmatter, and add a `client:*` directive (e.g. `client:visible`) to any component that needs to be interactive in the browser.

Use this template:

```markdown
---
title: "Your Project Title"
description: "One-sentence description shown in cards and meta tags."
role: "Your Role (e.g. Founder, Lead Engineer)"
year: "2026"
stack: ["React", "TypeScript", "Node.js"]
thumbnail: "/images/works/<your-image-name>.png"
images: []
liveUrl: "https://yourproject.com"
sourceUrl: "https://github.com/you/repo"
featured: true
order: 1
---

## Overview

High-level summary of the project...

## The Problem

What problem does it solve?

## What I Built

- Bullet point list of key features or systems

## Technical Details

Deeper technical narrative...
```

---

## Step 3 — Set the `order` field

`order` controls the sort position in both the carousel and the archive grid (ascending). Existing works:

| File | `order` |
|---|---|
| `gladekit.md` | 1 |
| `pokelit.mdx` | 2 |
| `paaw.mdx` | 3 |
| `gladecore.md` | 4 |
| `cursed-crown.md` | 5 |
| `prediction-market-trader.md` | 6 |
| `fitcheck.md` | 7 |
| `vibe-learning.md` | 8 |
| `everglade.md` | 9 |
| `tcg-extraction.md` | 10 |

Set `order` to the next available number, or shift existing orders if you want to insert somewhere in the middle. Every work needs its own `order`: `npm test` fails when one is missing or two works share a value.

---

## Step 4 — (Optional) Add gallery screenshots

The `images` array on the frontmatter lets you add a scrollable gallery on the project detail page. Add image paths the same way as the thumbnail:

1. Place images in `public/images/works/`
2. Reference them in the frontmatter:

```yaml
images:
  - "/images/works/gladekit-screen-1.png"
  - "/images/works/gladekit-screen-2.png"
```

Videos go in a separate `videos` array and show after the images. To control the order and captions of mixed images and videos, use `media` instead (see `pokelit.mdx`); when `media` lists any items, it overrides `images` and `videos`.

The gallery is built from real media only, with no placeholder cards: a work with no `images`, `videos` or `media` renders an empty Gallery section.

---

## Step 5 — Preview locally

```bash
npm run dev
```

Then visit:

- `http://localhost:4321/works` — carousel and archive grid
- `http://localhost:4321/works/<slug>` — detail page

Before pushing, run `npm test` on the Node version in `.nvmrc` (see [TESTING.md](../TESTING.md)). Netlify runs it before every deploy, so a failing works check (Steps 1 and 3) blocks the release.

---

## Frontmatter reference

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | yes | Project name |
| `description` | string | yes | Short description (cards, meta) |
| `role` | string | yes | Your role on the project |
| `year` | string | yes | Year completed / launched |
| `stack` | string[] | yes | Tech stack tags |
| `thumbnail` | string | yes | Path to image in `public/` |
| `longDescription` | string | no | Longer description |
| `images` | string[] | no | Gallery screenshots |
| `videos` | string[] | no | Gallery videos, shown after `images` |
| `media` | `{ type: "image" \| "video", src, label? }[]` | no | Ordered gallery items; overrides `images` and `videos` |
| `liveUrl` | string (URL) | no | Link to live product |
| `sourceUrl` | string (URL) | no | Link to source code |
| `featured` | boolean | no | Defaults to `false` |
| `employer` | boolean | no | Defaults to `false`. Set `true` for work built as an employee: the page's JSON-LD names you `contributor` instead of `author` and omits `dateCreated` and `sameAs` |
| `order` | number | yes | Sort position, unique across works. The schema defaults it to `99`, but `npm test` fails when it is missing or shared |
| `caseStudy` | `"gladecore"` \| `"gladekit"` \| `"pokelit"` \| `"paaw"` | no | Interactive case study rendered on the detail page. A new value needs adding to the enum in `src/content/config.ts`, plus a label in `caseStudyLabels` and a render branch in `src/pages/works/[slug].astro` |

---

## File structure recap

```
personal-website/
├── public/
│   └── images/
│       └── works/
│           ├── gladekit.png          ← thumbnails / screenshots live here
│           ├── your-project.png      ← or .jpg
│           └── your-project.webp     ← WebP sibling, same base name
└── src/
    └── content/
        └── works/
            ├── gladekit.md           ← one file per project
            └── your-project.md       ← or .mdx
```
