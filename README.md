# danielfang.me

Personal site for **Daniel Fang** — works, lab experiments, investments, and writing.

Live at [danielfang.me](https://danielfang.me).

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | [Astro 5](https://astro.build) — static by default, React islands where needed |
| UI | [React 18](https://react.dev) for interactive components |
| Styling | [Tailwind CSS](https://tailwindcss.com) + CSS custom properties for design tokens |
| Animation | [GSAP](https://gsap.com) (ScrollTrigger) and [Lenis](https://lenis.darkroom.engineering) for smooth scroll |
| Content | Astro Content Collections — Markdown for works, MDX for blog, JSON for investments |
| Deployment | [Netlify](https://netlify.com) |

---

## Project structure

```
src/
├── pages/           # Routes: /, /works, /works/[slug], /lab, /blog, /blog/[slug],
│                    #         /investments, /contact, /404
├── layouts/         # BaseLayout (meta, nav, footer)
├── components/      # Nav, Footer, HeroSection, WorksCarousel, LabGrid,
│   ├── case-studies/    #   interactive case studies for select works
│   ├── lab/             #   shader / particle experiments
│   └── museum/          #   museum-style media components
├── content/
│   ├── works/       # Project entries (Markdown + frontmatter)
│   ├── blog/        # Posts (MDX)
│   └── investments/ # Investment entries (JSON)
├── data/            # Static data (e.g. experiments index)
├── scripts/         # Client-side enhancements (magnetic CTA, etc.)
└── styles/          # global.css — tokens, base, utilities

public/              # Static assets — favicon, og image, images, videos, museum
```

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server at `http://localhost:4321` |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing — hero, works carousel, timeline |
| `/works` | Full works list |
| `/works/:slug` | Project detail with media gallery and optional interactive case study |
| `/lab` | Generative experiments (shaders, particles, vertex fields) |
| `/lab/:experiment` | Individual experiment page |
| `/blog` | Writing index |
| `/blog/:slug` | Post (MDX) |
| `/investments` | Investment portfolio |
| `/contact` | Contact + social links |

---

## Design system

- **Palette** — Dark base (`#0A0A0A`), surface shades, off-white text, single accent.
- **Typography** — Display (Syne), body (Plus Jakarta Sans), mono (JetBrains Mono).
- **Motion** — Consistent easing (`cubic-bezier(0.16, 1, 0.3, 1)`), durations 150–600ms; all animations respect `prefers-reduced-motion`.

---

## Adding content

Works, blog posts, and investments are defined as content collections in `src/content/`. See `src/content/config.ts` for the schema of each collection.

- **Works** — Add a `.md` file under `src/content/works/`. Required frontmatter: `title`, `description`, `role`, `year`, `stack`, `thumbnail`. Set `featured: true` to surface on the home carousel.
- **Blog** — Add a `.mdx` file under `src/content/blog/` with `title`, `date`, `excerpt`, and optional `tags`.
- **Investments** — Add a `.json` file under `src/content/investments/`.

---

## License

Source code is available for reference. Content (writing, images, project descriptions) is © Daniel Fang. Please don't redeploy this site as your own.
