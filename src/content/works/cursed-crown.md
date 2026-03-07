---
title: "Cursed Crown"
description: "Co-Op Multiplayer, 3D action RPG built in Unreal Engine"
role: "Founder"
year: "2023"
stack: ["C++", "Unreal Engine 5", "GameplayAbilitySystem"]
thumbnail: "/images/works/dashboard.png"
images: []
featured: false
order: 3
---

## Overview

A real-time analytics platform processing millions of events per day, used by growth and operations teams to monitor product health, user behavior, and business metrics. The dashboard replaced a collection of disconnected spreadsheets and third-party tools that had become impossible to maintain.

The final system reduced time-to-insight for analysts from hours to seconds, and directly influenced three product decisions in its first month of deployment.

## The Problem

The team had access to data — plenty of it — but no coherent way to surface it. Metrics lived in separate systems: some in a BI tool, some in custom SQL queries shared via Slack, some in third-party analytics platforms with inconsistent definitions. When stakeholders asked "how is feature X performing?", the answer required stitching together four different data sources manually.

We needed a single, trustworthy interface for operational metrics that non-technical team members could configure themselves.

## What I Built

- **Customizable widget grid** — users drag, resize, and configure metric widgets using a grid layout system built on `react-grid-layout`, with per-user persistence
- **10+ chart types** built with D3.js, including time-series line charts with brush-to-zoom, funnel charts, cohort retention tables, and geo heatmaps
- **Real-time updates** via WebSocket subscriptions — metric values and charts update live with smooth GSAP transitions, no page reload required
- **Global filter system** — date range, user segment, and cohort filters propagate across all widgets simultaneously using a Zustand store
- **Export pipeline** — any widget can export its data as CSV or a shareable image using Canvas-based rendering

## Technical Details

The biggest technical challenge was **render performance at scale**. D3.js gives you full control but no automatic optimizations — we had charts trying to render 50,000+ data points, which caused frame drops on lower-end machines.

The solution was a tiered rendering strategy: at coarse zoom levels, we use server-side aggregation to reduce point count; as users zoom in via the brush control, the client requests finer-grained data only for the visible time window. Combined with `requestAnimationFrame` scheduling for D3 updates and memoized scale computations, we hit consistent 60fps even on 4-year-old laptops.

State management was a deliberate choice for Zustand over Redux. The dashboard state has a relatively shallow shape — filters, widget configs, and realtime values — and Zustand's minimal boilerplate kept the store logic readable without ceremony.
