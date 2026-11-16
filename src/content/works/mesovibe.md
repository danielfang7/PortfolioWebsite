---
title: "MesoVibe"
description: "Open-source desktop companion that tracks EXP, loot and chat by reading the game window"
role: "Solo Developer"
year: "2026"
stack: ["Rust", "Tauri 2", "TypeScript", "ScreenCaptureKit", "Windows Graphics Capture", "Web Workers", "ts-rs"]
thumbnail: "/images/works/MesoVibe_ProjectImage.png"
media:
  - type: "image"
    src: "/images/works/MesoVibe_ProjectImage.png"
    label: "EXP, loot and chat panels"
  - type: "image"
    src: "/images/works/MesoVibe_Website.png"
    label: "mesovibe.com"
liveUrl: "https://mesovibe.com"
sourceUrl: "https://github.com/danielfang7/MesoVibe"
featured: true
order: 6
---

## Overview

MesoVibe is a free, open-source desktop companion for MapleStory Classic World. It reads the game window the way a stream viewer sees it and turns what's on screen into the numbers players actually want: EXP per hour and time to the next level, the mesos and items picked up and what an NPC shop would pay for them, sessions broken down map by map, and whispers, party and friend chat pulled out of a crowded chat box into their own tabs. It runs as a panel beside the game or as a small click-through overlay on top of it.

It ships as a roughly 5 MB native app for Windows and macOS that updates itself, and put out six releases in its first two weeks.

## The Problem

Classic MMO play is a numbers game - which map pays best, how long until the next level - but the game shows almost none of it. In a busy town, megaphones bury the whispers meant for you. Most game companions get their numbers by reading memory or hooking the client, which is the kind of tool that gets players banned.

MesoVibe gets everything from pixels alone. It never sends input, never reads or writes the game's memory or files, never injects code and never touches network traffic, and the project doesn't accept changes that would. That means reading a pixel font off a live, moving, scaled and sometimes letterboxed game window, four times a second, without slowing the game down.

## What I Built

- A Rust engine that turns screen capture into typed events: ScreenCaptureKit on macOS and Windows Graphics Capture on Windows feed one recognizer for each thing on screen - the EXP bar, the chat box, the pickup notices and the minimap's map name. Most of the time it copies only a strip along the bottom of the window, and it stops looking while the game is minimized.
- Text recognition with no OCR library and no shipped game art: glyph atlases are learned on the player's own machine from their own screen, matching is exact, and anything unexpected comes out as unreadable, never as a guess.
- A Tauri 2 desktop shell with a side panel, a mini-HUD and a click-through chat overlay, a tray icon that opens MesoVibe when the game starts, local session history and signed auto-updates.
- A plugin SDK: plugins receive typed events (TypeScript types generated from the Rust schema with ts-rs), describe their panels with host-rendered components, and pick semantic variants rather than colors. They get no DOM, no IPC and no network. The Session Tracker behind EXP and loot history is itself a first-party plugin.
- Local-first privacy: no account and no tracking, and chat is held only in memory. The only network call is the update check, and an in-app "What MesoVibe sees" view shows exactly what it's reading.

## Technical Details

### Self-calibrating digit reading

The EXP bar is drawn in a one-bit pixel font, and MesoVibe has to learn which shape is which digit without the player typing anything. It relies on an invariant: the bar's percentage is always round(EXP x 10000 / EXP needed for the level), in hundredths. Of the 3.6 million ways to assign names to ten digit shapes, only one makes that equation hold across a handful of different EXP readings. The reader watches EXP change, eliminates assignments, and starts reporting once a single one survives. Punctuation is named by color and position.

### Undoing the game's scaling

Up to 768 lines tall, the game draws at its own pixel size. Above that, it renders a 768-line picture and stretches it with bilinear filtering, and Full Screen adds letterbox bars on displays of another shape. Rather than learn glyphs at every size, the engine inverts the stretch. Bilinear scaling is linear and separable with known geometry, so each axis reduces to a tridiagonal least-squares solve. On recorded captures, the recovered HUD comes within 1.2/255 of the true 1x pixels and every glyph comes back exact, so one learned atlas reads every window size. Retina pixel doubling, and the one- or two-pixel offsets Wine introduces on a Mac, are detected from the pixels and undone first.

### Reading fading notices over a moving scene

Pickup notices ("Fire Boar's Tooth x1 earned.") are white text with a one-pixel shadow, drawn over whatever scene is behind them, and they fade within seconds. The reader finds strokes by the brightness step between core and shadow, which holds over white clouds as well as dark caves. It counts new lines by how far the existing ones scrolled up, so picking up the same item twice counts twice, and a camera pan behind static text counts as nothing. Map names are identified by the exact shape of their lettering rather than read as text, since that font renders differently under Wine.

### Testing

Each recognizer keeps its screen region, parser, confidence and tests in one module. The Rust workspace carries more than 200 unit tests, replay tools run every recognizer over recorded capture sessions and check invariants such as "EXP never falls except at a level-up or a death", and Node tests cover the plugin bundle, the SDK and the release manifest.
