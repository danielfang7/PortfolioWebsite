---
title: "Example Project"
description: "A full-stack web application with a focus on performance, accessibility, and developer ergonomics."
role: "Sole Developer"
year: "2024"
stack: ["TypeScript", "React", "Next.js", "Tailwind CSS"]
thumbnail: "/images/works/placeholder.png"
images: []
liveUrl: "https://example.com"
sourceUrl: "https://github.com/danielfang"
featured: true
order: 1
---

## Overview

This project started as an exploration into how far you can push a TypeScript + React stack before needing to reach for additional abstractions. The goal was to ship a performant, accessible web application while keeping the dependency graph as lean as possible.

The final product handles thousands of concurrent users with sub-100ms response times, achieves a perfect Lighthouse score, and has been used as an internal reference architecture at two different companies.

## The Problem

Teams building modern web apps tend to reach for heavy frameworks and bloated state management libraries before they've felt the pain that those tools solve. This leads to slow initial builds, complex debugging surfaces, and onboarding friction that compounds over time.

The specific challenge here was: **can we build a production-quality product with vanilla React patterns, server components, and a focused set of primitives?**

## What I Built

A full-stack web application with:

- **Server-first rendering** via Next.js App Router, with React Server Components for zero-JS data fetching paths
- **Type-safe API layer** using TypeScript end-to-end, from database schema to UI props
- **Accessible component library** — every interactive element has keyboard navigation, ARIA labels, and focus management tested against screen readers
- **Edge-ready architecture** — all dynamic routes are compatible with Vercel Edge Runtime for sub-50ms TTFB globally

## Technical Details

The most interesting engineering challenge was building a real-time collaborative feature without reaching for a WebSocket library. I used Server-Sent Events (SSE) for server-to-client updates and standard HTTP POST for client mutations, which reduced infrastructure complexity significantly while meeting the latency requirements.

Data fetching is co-located with UI components using React Server Components, eliminating the classic N+1 API call problem without needing a data-fetching abstraction like React Query or SWR.

The TypeScript setup uses `strict: true` with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` — this catches a meaningful class of bugs at compile time that would otherwise surface in production.
