# Adding a New Work / Project

This guide walks through everything needed to add a new project to the Works carousel and archive grid.

---

## Overview

Each project is a single Markdown file in `src/content/works/`. Astro's content collection picks it up automatically — no component edits or imports required.

The file drives two places on the site:

| Location | URL | Source |
|---|---|---|
| Works carousel (hero) | `/works` | `src/components/WorksCarousel.astro` |
| Full archive grid | `/works` | `src/pages/works/index.astro` |
| Project detail page | `/works/<slug>` | `src/pages/works/[slug].astro` |

---

## Step 1 — Add a thumbnail image

Place the project's thumbnail in:

```
public/images/works/<your-image-name>.png
```

`public/` is the static assets root. Anything inside it is served at `/` — so `public/images/works/gladekit.png` becomes `/images/works/gladekit.png` in the browser.

**Recommended:** square or 16:9 image, at least 800×800 px.

---

## Step 2 — Create the Markdown file

Create a new file at:

```
src/content/works/<slug>.md
```

The filename becomes the URL slug. `gladekit.md` → `/works/gladekit`.

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
| `ai-writing-tool.md` | 2 |
| `design-system.md` | 3 |
| `mobile-app.md` | 4 |
| `data-dashboard.md` | 5 |

Set `order` to the next available number, or shift existing orders if you want to insert somewhere in the middle.

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

If `images` is empty (`[]`), the detail page falls back to generated gradient placeholders automatically — nothing breaks.

---

## Step 5 — Preview locally

```bash
npm run dev
```

Then visit:

- `http://localhost:4321/works` — carousel and archive grid
- `http://localhost:4321/works/<slug>` — detail page

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
| `images` | string[] | no | Gallery screenshots |
| `liveUrl` | string (URL) | no | Link to live product |
| `sourceUrl` | string (URL) | no | Link to source code |
| `featured` | boolean | no | Defaults to `false` |
| `order` | number | no | Sort position, defaults to `99` |

---

## File structure recap

```
personal-website/
├── public/
│   └── images/
│       └── works/
│           ├── gladekit.png          ← thumbnails / screenshots live here
│           └── your-project.png
└── src/
    └── content/
        └── works/
            ├── gladekit.md           ← one file per project
            └── your-project.md
```
