# danielfang.me

Personal portfolio and showcase site for **Daniel Fang** — engineering, projects, investments, and writing. Built to demonstrate craft through the site itself: clean layout, modern animations, and a 3D scroll-linked works carousel.

**Domain:** [danielfang.me](https://danielfang.me) · **Hosting:** Netlify · **Status:** In development

---

## Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Astro](https://astro.build) 5 (static by default, React islands where needed) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) + CSS custom properties (design tokens) |
| **Animation** | [GSAP](https://gsap.com) (ScrollTrigger, ScrollToPlugin) + optional [Lenis](https://lenis.studio) (smooth scroll) |
| **Content** | Astro Content Collections — Markdown for works, MDX for blog |
| **Deployment** | [Netlify](https://netlify.com) (continuous deploy from Git) |

---

## Project structure

```
src/
├── pages/           # Astro routes (index, works, blog, investments, contact, 404)
├── layouts/         # BaseLayout (meta, nav, footer)
├── components/      # Nav, Footer, HeroSection, WorksCarousel
├── content/         # Content Collections
│   ├── works/       # Project entries (Markdown)
│   ├── blog/        # Posts (MDX)
│   └── investments/ # Investment entries (JSON)
├── styles/          # global.css (tokens, base, utilities)
└── lib/             # (optional) helpers, animation utilities

public/               # Static assets, favicon
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (default port 4321) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |

---

## PRD overview (plan)

The site follows a single-page–style flow with scroll sections and deep-linkable routes.

### Goals

- **Demonstrate frontend craft** — The site is the portfolio; every interaction and transition should reflect strong design and engineering.
- **Showcase work** — Projects in an engaging 3D card carousel (scroll-linked, with snap).
- **Keep it simple** — Clean, readable layout; animations that enhance, not distract.
- **Drive engagement** — Clear paths to works, blog, investments, and contact.

### Non-goals (v1)

- No CMS or admin panel (content via code/markdown).
- No e-commerce or payments.
- No heavy 3D/WebGL beyond the card carousel.
- No user accounts or auth.

### Site map

| Route | Description |
|-------|-------------|
| `/` | Landing + hero, works carousel |
| `/works` | Full works list + carousel |
| `/works/:slug` | Individual project detail |
| `/investments` | Investment portfolio |
| `/blog` | Blog listing |
| `/blog/:slug` | Blog post (MDX) |
| `/contact` | Contact + social links |

### Development phases (from PRD)

1. **Foundation & design system** — Astro, Tailwind, tokens, typography, Nav, grid.
2. **Hero & landing** — Staggered entrance, social links, scroll cue.
3. **Works carousel** — 3D scroll-linked cards, GSAP ScrollTrigger, snap, metadata under cards.
4. **Works detail** — Project pages, media, back nav.
5. **Investments** — Grid, scroll-triggered entrances, data from content.
6. **Blog** — Content collections, listing, post template, MDX, code highlight, TOC.
7. **Contact & footer** — Contact section, optional Netlify Forms.
8. **Polish** — Performance, a11y, SEO, motion preferences, Netlify config.

### Design system (summary)

- **Palette:** Dark base (`#0A0A0A`), surface shades, off-white text, single accent (e.g. `#6C63FF`).
- **Typography:** Display (Syne), body (Plus Jakarta Sans), mono (JetBrains Mono).
- **Motion:** Consistent easing (`cubic-bezier(0.16, 1, 0.3, 1)`), durations 150–600ms; all animations respect `prefers-reduced-motion`.

---

## Deployment (Netlify)

- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node:** 20 (set in `netlify.toml`)
- Custom domain `danielfang.me` configured via Netlify DNS.
