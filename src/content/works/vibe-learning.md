---
title: "Vibe Learning"
description: "Passive learning layer for AI-assisted development"
role: "Solo Developer"
year: "2026"
stack: ["React Native", "Expo", "Supabase", "OpenAI"]
thumbnail: "/images/works/mobile.png"
images: []
featured: true
order: 4
---

## Overview

This project is an AI-powered “passive learning layer” for AI-assisted development that sits alongside tools like Cursor and Claude Code and turns everyday coding sessions into tailored micro-learning experiences. It monitors what a developer is building (prompts, diffs, languages, concepts) and periodically surfaces targeted interventions—like quick concept checks or micro-explanations—without breaking flow, all packaged as a VS Code / Cursor extension with a local knowledge state and no required backend.

Long-term, the goal is a full learning companion for developers: a concept-aware system that tracks what you’ve seen and how well you understand it, schedules spaced repetition across topics, supports multiple AI coding tools via adapters, and eventually powers team-level insights and dashboards. Right now, the focus is on the Phase 1 MVP: core extension scaffolding, a Claude Code adapter, a simple intervention engine, SQLite-backed knowledge tracking, and a basic sidebar UI.

## The Problem

Modern AI coding tools make it easy to ship features quickly, but they also make it easy to “offload understanding” to the model - developers see working code without deeply learning the underlying concepts or patterns. There’s no lightweight, in-the-moment system that turns these AI-assisted sessions into structured practice without requiring a separate course, tutorial, or context switch.

The specific challenge here is: can we embed a learning loop directly into AI-assisted coding so that every few prompts (or after a break), the system can infer what you’re working with - like React hooks, async/await, or database transactions - and then surface just-in-time questions, explanations, and mini-challenges that adapt over time, all while respecting privacy and staying local-first?

## What I Built

A VS Code / Cursor extension architecture for an AI-powered learning layer with:
- Extension scaffold and adapter design for tools like Cursor, Claude Code, and Codex, based on a SessionAdapter interface that cleanly separates data collection (prompts, diffs, file changes) from learning logic.
- Intervention Engine design that defines structured Intervention types (Concept Check, Explain It Back, Micro-Reading, etc.) and a loop that periodically calls Anthropic’s Claude API to generate targeted interventions from recent session context.
- Local knowledge state model backed by SQLite (v1) that tracks per-concept stats such as seen count, last seen, average score, and next review timing, forming the basis for spaced repetition and difficulty adjustment.
- Phase-based roadmap and UX flow for a sidebar panel that shows interventions, captures responses, and gradually expands into spaced repetition, streaks/history, concept maps, and team features.

In progress: the actual VS Code extension implementation, the first production-ready Claude Code adapter, wiring the SQLite store into the intervention loop, and the initial sidebar UI. Future phases will add additional adapters (Cursor, Codex), more intervention types, configurable triggers, and optional backend syncing.

## Technical Details

A core engineering challenge is designing a clean separation between context collection, learning logic, and tool-specific adapters so that adding a new AI coding tool doesn’t require rewriting the engine. This led to a SessionAdapter abstraction that standardizes how prompts, file diffs, languages, and high-level concepts are gathered, and how trigger events (prompt count thresholds, idle gaps, manual triggers) notify the engine.

Another key piece is the Intervention Engine and knowledge state. For each trigger, it takes a slice of recent prompts and diffs, runs a cheap concept-extraction pass, and then calls Claude with both session context and the developer’s historical performance on related concepts. The engine chooses an intervention type (e.g., Concept Check vs. Micro-Reading), tags it with difficulty and concept metadata, and records the result back into SQLite for future scheduling.

On the privacy and product side, the design assumes a local-first, no-backend v1: interventions are generated using Claude but contextual data is filtered and capped (e.g., ~2000 tokens of diff per trigger), with support for a .vibelearningignore file so teams can exclude sensitive paths. Longer term, this local core can be extended with optional backend services for team features, dashboards, and cross-machine sync without changing the extension’s learning loop.
