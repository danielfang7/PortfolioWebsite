---
title: "TCG Extraction"
description: "TCG-inspired extraction roguelite deckbuilder built in Godot"
role: "Solo Developer"
year: "2026"
stack: ["Godot 4.6", "GDScript", "GLSL", "gdUnit4", "GitHub Actions"]
thumbnail: "/images/works/TCGExtraction_ProjectImage.png"
images:
  - "/images/works/TCGExtraction_ExampleImage.png"
featured: false
order: 8
---

## Overview

TCG Extraction is a roguelite that ports the extraction-shooter risk structure onto a deckbuilder. Booster packs are unstable pocket worlds: you crack one open, raid the branching map inside with a 15-card deck, and everything you loot is provisional until you make it out. At each Extraction Gate the game asks one question - bank the haul, or go deeper and risk it all? Die, and you lose everything you found.

The collection is the real progression: rarity tiers, shiny variants worth double, boss-exclusive chase cards, and duplicate-fed upgrades wrap a card-collector's metagame around every run. Version 0.1 shipped content-complete in a two-week burst - 30 cards, 6 enemies including a phase-shifting boss, two difficulty tiers, and ten fully themed screens - built PR-by-PR with 26 reviewed pull requests.

## The Design Problem

Extraction games live or die on one moment: the held-breath instant before you decide whether to grab the treasure and run. Early playtesting-by-simulation showed the game's central decision wasn't actually a decision - pushing to the boss paid roughly 11x the expected value of banking early for only a 13% death risk, so a rational player always pushed.

The fix was measurement, not vibes. A balance probe runs 120 seeded simulations per cell across difficulty, deck upgrade level, and extract strategy. After tuning, the gate is a designed coin flip: bank at depth 2 for 217 gold expected value at 8% death risk, or push to depth 3 for 305 at 35%.

## What I Built

- A pure, engine-free simulation core: all game rules live in Node-free GDScript classes, the UI can only send typed Command objects (a closed vocabulary of 12), and the sim validates them and emits events back - a seam designed to become the network boundary for future co-op
- Resume-as-replay persistence: a run is stored as an append-only command log (seed + commands), and resuming replays the log through the deterministic sim - crash recovery, playtest analytics, and replay debugging all fall out of one decision
- Total determinism enforced by CI: all randomness flows through named seeded streams, and raw RNG calls (randf, shuffle, pick_random) are grep-banned in the pipeline; same seed plus same commands produces a byte-identical event stream, asserted by test
- Procedural Slay-the-Spire-style node maps, a data-driven JSON content pipeline with a loud boot-time validator, an atomic save system with rotating backups and anti-duplication safeguards, and a custom GLSL foil shader for shiny cards
- 241 tests across 28 suites, including a per-card behavior suite for all 30 cards and a command-fuzz suite that fires randomized and adversarial commands at the sim while checking invariants after every step

## Technical Details

Accessibility is engineered into the card language rather than bolted on: rarity is quadruple-redundant (color, pip count, corner-stamp shape, and frame escalation) with no red/green anywhere. A custom tool re-renders screenshots the way a dichromat sees them - Machado et al. (2009) matrices applied in linear light - and it caught a real shipped bug: the rarity corner stamp had never rendered, which mattered precisely because rare and epic frames collapse to the same blue under deuteranopia.

The economy uses transaction-grade discipline for a single-player game: entry fees are stored inside the run-start log entry so the fee and the run exist atomically, banked run IDs kill the extract-then-crash duplication exploit, and a soft-lock invariant guarantees every collection mutation leaves at least one legal deck constructible - the upgrade system refuses transactions that would break it.
