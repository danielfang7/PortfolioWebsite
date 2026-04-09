---
title: "GladeKit"
description: "AI agent for game development"
role: "Founder"
year: "2026"
stack: ["Electron", "React", "TypeScript", "FastAPI", "Python", "C#", "Unity 6", "AWS ECS/Fargate", "Redis", "Supabase"]
thumbnail: "/images/works/GladeKit_ProjectImage.png"
images:
  - "/images/works/GladeKit_ProjectImage.png"
videos:
  - "/videos/works/GladeKit_Demo_Video.mp4"
liveUrl: "https://gladekit.com"
sourceUrl: "https://github.com/Glade-tool/GladeKitUnityPlugin"
featured: true
order: 1
caseStudy: "gladekit"
---

## Overview

GladeKit is an AI coding assistant built specifically for Unity game development - where you type what you want in plain English and the system actually does it: writing scripts, wiring up GameObjects, building animation state machines, setting up physics, configuring lighting, and more, all live inside your open Unity project.

The product runs across three tightly coordinated surfaces: a Unity Editor plugin, an Electron desktop app, and a cloud AI backend. The challenge wasn't just building a chatbot - it was building a real-time agentic system that could see your project, reason about it, take action through 220+ purpose-built Unity tools, and recover gracefully when things go wrong.

## The Problem

Unity workflows are tedious by design. A single gameplay feature might require creating and parenting GameObjects, attaching and configuring components, writing a script, compiling it, wiring up references, and adjusting transform values - all through a sequence of manual editor clicks. The question was: can AI be genuinely useful here if given real project context and real editor control, rather than just answering questions in a generic chat box?

## What We Built

A production AI system for Unity with:

- Unity Editor plugin that gathers live project context - scene hierarchy, script contents, installed packages, selected objects - and exposes 220+ typed tools covering GameObjects, transforms, animation state machines, physics, materials, lighting, UI, terrain, NavMesh, audio, VFX, prefabs, and scripting
- Electron desktop app in TypeScript/React for chat, streaming, auth, session management, and cross-platform distribution on macOS and Windows
- Cloud backend in FastAPI with a streaming agentic loop that coordinates AI model calls, tool dispatch, RAG injection, conversation memory, and multi-turn recovery
- Multi-model support for OpenAI, Anthropic, and Gemini, with a provider abstraction layer, per-model cost tracking, token budget enforcement, and Redis-backed caching

## Technical Details

The core engineering challenge was orchestrating a real-time loop across three independent runtimes: Unity's main thread, an Electron process, and a cloud backend. The model streams a response, emits tool calls mid-stream, those calls get dispatched to the Unity bridge over HTTP, results return to the backend, and the loop continues - all without stalling the user experience. The Unity bridge runs an embedded HTTP server that dispatches every call to Unity's main thread via EditorApplication.delayCall, since the entire Editor API is single-threaded.

Context orchestration was equally important. The system collects live Unity project state on every request - hierarchy, components, script contents - and the backend filters which of the 220+ tools are relevant to the current task, augments the prompt with RAG-retrieved Unity documentation, and injects conversation and project memory. This is what made the assistant actually reliable for real project work rather than just syntactically plausible.

On the infrastructure side, we built: Dockerized Python services on AWS ECS/Fargate with ECR, an ALB for routing, S3-hosted auto-updater flows, and signed Electron releases for both platforms.
