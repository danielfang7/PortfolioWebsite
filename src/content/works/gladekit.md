---
title: "GladeKit"
description: "AI agent for game development"
role: "Founder"
year: "2026"
stack: ["Electron", "React", "Typescript", "FastAPI", "AWS ECS/Fargate", "Unity 6"]
thumbnail: "/images/works/GladeKit_ProjectImage.png"
images: []
liveUrl: "https://gladekit.com"
sourceUrl: "https://github.com/Glade-tool/GladeKitUnityPlugin"
featured: true
order: 1
---

## Overview

This project is an AI-powered assistant for Unity game development that lets users describe what they want in natural language and have the system create scripts, manipulate GameObjects, add components, and iterate directly inside the Unity Editor.

We built the product as a multi-surface system spanning a Unity plugin, an Electron desktop app, and a cloud-hosted backend. The result is a real-time developer workflow for Unity that combines streaming chat, tool execution, project context gathering, authentication, usage tracking, and production deployment into a single cohesive platform.

## The Problem

Building inside Unity often requires constant context switching between editor panels, scripts, documentation, and repetitive scene or component setup. Even simple gameplay tasks can involve a long chain of manual actions across GameObjects, transforms, prefabs, settings, and code.

The specific challenge here was: can we make AI genuinely useful inside Unity by giving it real project context, real-time feedback, and safe direct control over editor actions instead of limiting it to a basic chat box?

## What I Built

A production-ready AI system for Unity with:

- Unity Editor integration that gathers scene, script, package, and project context and executes tool calls directly against the active project
- Desktop application built with Electron, React, and TypeScript for chat, authentication, session handling, packaging, and distribution
- Cloud backend built with FastAPI for streaming chat, model orchestration, tool-call coordination, session APIs, and project indexing
- Multi-model AI platform supporting OpenAI, Anthropic, and Gemini models, with RAG, usage controls, caching, and real-time WebSocket communication

## Technical Details

The hardest engineering problem was coordinating a tight real-time loop across three environments: the Unity Editor, a desktop client, and a cloud AI backend. We used WebSocket-based streaming so the product could send partial responses quickly, execute tool calls as they were generated, return tool results back to the model, and continue the agent loop without breaking the user experience.

A major part of the system is context orchestration. The Unity side collects relevant project state like scene hierarchy, installed packages, selected objects, and script content, while the backend filters tools, manages request state, and augments prompts with RAG and conversation context. That made the assistant meaningfully more reliable than a generic LLM wrapper because it could act on the actual Unity project rather than respond in the abstract.

On the platform side, I also worked across product infrastructure: authentication and usage tracking, Redis-backed caching and rate limiting, Dockerized Python services, and AWS ECS/Fargate deployment with ECR, ALB, S3-based updater flows, and packaged Electron releases for macOS and Windows.
