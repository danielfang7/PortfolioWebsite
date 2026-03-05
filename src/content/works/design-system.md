---
title: "Component Library"
description: "A production design system with 60+ components, theming, and full Storybook documentation."
role: "Lead Engineer"
year: "2023"
stack: ["React", "TypeScript", "Storybook", "CSS Modules"]
thumbnail: "/images/works/design-system.png"
images: []
featured: true
order: 2
---

## Overview

A design system built for a 40-person engineering team that had grown beyond what ad-hoc component sharing could sustain. The codebase had accumulated five different button variants, three modal patterns, and no shared color system. This project replaced all of that with a single, well-documented library.

Over eight months it became the foundation for four separate product surfaces, saving an estimated 2–3 engineering weeks per new feature that required UI work.

## The Problem

When teams scale past a certain size, visual consistency breaks down — not because engineers don't care, but because there's no friction-free way to share and discover shared components. Copy-paste proliferates. Design reviews catch regressions late. New team members reinvent existing patterns.

The company had hit this inflection point. The design and engineering teams had diverged: Figma components didn't map 1:1 to code, which meant every handoff required manual translation work. We needed a system that both sides could trust as the source of truth.

## What I Built

- **60+ production components** — everything from typography primitives to complex data table, date picker, and combobox patterns
- **Multi-theme support** using CSS custom properties with a light/dark/high-contrast mode, switchable at runtime without a page reload
- **Storybook documentation** with live prop controls, accessibility annotations, and usage guidelines for every component
- **Design token pipeline** that syncs Figma variables to CSS and TypeScript constants via a CI step, keeping design and code in sync automatically
- **Testing suite** using React Testing Library with 94% statement coverage and snapshot tests for visual regression detection

## Technical Details

The hardest part was not building the components — it was defining the **token taxonomy**. We went through three iterations before landing on a semantic naming system (`color.surface.default`, `color.text.secondary`) rather than raw values. This makes it possible to change the entire color palette by editing 12 token definitions rather than hunting through component files.

For the component API design, I followed a principle of **composition over configuration**: instead of a `<Button variant="primary" size="lg" iconLeft={...} isLoading />` monolith, we have a `<Button>` with a small surface area that composes with `<Icon>` and `<Spinner>`. This keeps the prop surface small and prevents the "options explosion" that plagues most design systems.

The Storybook setup includes a custom theme, an accessibility panel backed by `axe-core`, and an auto-generated changelog that shows which component changed in each release.
