---
title: "GladeKit"
description: "AI agent for Unity and Godot game development"
role: "Founder"
year: "2026"
stack: ["Electron", "React", "TypeScript", "FastAPI", "Python", "C#", "GDScript", "Unity 6", "Godot 4", "AWS ECS/Fargate", "Redis", "Supabase"]
thumbnail: "/images/works/GladeKit_ProjectImage.png"
images:
  - "/images/works/GladeKit_ProjectImage.png"
videos:
  - "/videos/works/GladeKit_Demo_Video.mp4"
liveUrl: "https://gladekit.com"
sourceUrl: "https://github.com/Glade-tool/glade-mcp"
featured: true
order: 1
caseStudy: "gladekit"
---

## Overview

GladeKit is an agentic AI assistant for game development - you describe what you want in plain English and the system executes it directly inside your live Unity or Godot editor: writing scripts, wiring up scenes and components, building UI, configuring physics, importing assets, and then actually running the game to prove the result works.

The product spans four tightly coordinated surfaces: a C# Unity Editor bridge, a GDScript Godot addon, an Electron desktop app, and a cloud agentic backend - plus a free open-source MCP server that connects Cursor, Claude Code, and other MCP clients to the same editor bridges. The open-source side has grown to roughly 3,000 monthly installs on PyPI, 180+ GitHub stars, and a listing in the official MCP Registry.

## The Problem

Game editor workflows are tedious by design. A single gameplay feature might require creating and parenting objects, attaching and configuring components, writing a script, compiling it, wiring up references, and adjusting values - all through a sequence of manual editor clicks. Because the bridge runs inside the live editor and mutates state through real engine APIs, every change is valid-by-construction, immediately visible, and individually undoable.

The harder question turned out to be reliability: an agent that says "done" isn't worth much unless the game actually compiles, runs, and plays. Most of the deepest engineering went into making the agent prove its own work.

## What We Built

A production AI system for game development with:

- Editor bridges for two engines - a Unity plugin (embedded HTTP server, 280+ tool implementations across 32 categories) and a Godot addon (WebSocket server, 111 tools) - together exposing 370+ typed tools covering scenes, objects, scripting, animation, physics, materials, lighting, UI, terrain, audio, VFX, and asset pipelines
- Verification gates that force the agent to prove its work: a play-verify gate that enters Play mode and heals runtime errors, a visual-verify gate that renders the actual game view and reasons over the image, and a playability probe that drives simulated input to confirm the character can really walk and jump before the agent reports done
- Production-telemetry-driven reliability - we mined a week of production traces, identified the dominant failure mode (long chains of read-only calls without converging), and built mid-turn steering gates to force convergence, plus a "live loop" that watches Play mode and autonomously fixes runtime errors as they happen
- Cross-session memory with convention extraction (the system learns your coding style over time), engine-aware RAG over pgvector, ~40 play-tested gameplay scaffolders, GLADE.md project context injection, and a generative + CC0 asset pipeline (Meshy text-to-3D, Kenney catalog)
- Multi-model support across OpenAI, Anthropic, and Google behind a provider abstraction, with per-model cost tracking, Redis-backed caching, and a 92-case eval harness where first-try success rate is the headline metric, gated in CI

## Technical Details

The core engineering challenge was orchestrating a real-time agentic loop across independent runtimes: the game editor's main thread, an Electron process, and a cloud backend. The model streams a response, emits tool calls mid-stream, those calls get dispatched to the editor bridge, results return to the backend, and the loop continues - all without stalling the user experience. The Unity bridge dispatches every call to the editor's single-threaded API via EditorApplication.delayCall; the Godot bridge speaks WebSocket with per-session token auth.

The architecture proved about 70% engine-agnostic when we added Godot as a second engine: the cloud agentic loop, memory system, RAG, eval harness, and Electron UI all worked unchanged - only the bridge layer is engine-specific. That bet turned one product into a platform.

On the infrastructure side: Dockerized Python services on AWS ECS/Fargate behind a TLS-only ALB, Supabase for auth and pgvector, signed and notarized desktop releases for macOS and Windows with S3-hosted auto-update feeds, and CI that automatically mirrors the open-source bridges and MCP server to the public repo on every push.
