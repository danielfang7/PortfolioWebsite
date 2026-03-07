---
title: "Catopia"
description: "Browser-based writing assistant with context-aware suggestions, tone adjustment, and export to Notion."
role: "Sole Developer"
year: "2024"
stack: ["SvelteKit", "OpenAI API", "ProseMirror", "Cloudflare Workers"]
thumbnail: "/images/works/ai-writing.png"
images: []
featured: false
order: 5
---

## Overview

A browser-based writing assistant built on ProseMirror that ships zero client-side dependencies for AI features. The tool helps writers work through drafts by offering context-aware continuations, inline rewrites, and tone adjustments — all streamed in real time via a Cloudflare Workers edge backend.

The design goal was a tool that felt like a smart extension of your own thinking rather than something generating text for you. The AI features are surfaced subtly and never interrupt writing flow.

## The Problem

Most AI writing tools treat the editor as a thin wrapper around a prompt box. You stop writing, switch modes, generate a block of text, and paste it back in. That context-switch is disruptive and makes the output feel foreign to your own draft.

I wanted to build something where AI assistance was woven into the editing experience itself — available without interrupting the flow state that good writing requires.

## What I Built

- **ProseMirror-based rich text editor** with custom schema supporting headings, callouts, code blocks, and inline comments — built from scratch rather than using Tiptap or similar to maintain full control of the document model
- **Inline AI completions** — a subtle ghost-text suggestion appears after a short pause in typing, accepted with Tab, dismissed by continuing to type (similar to GitHub Copilot, adapted for prose)
- **Selection-based rewrites** — highlight any sentence or paragraph and choose from: shorten, expand, simplify, or change tone. The rewrite streams in-place character by character
- **Context window management** — the prompt sent to GPT-4 always includes the surrounding paragraphs and document outline, so suggestions are coherent with the broader piece, not just the current sentence
- **Notion export** — one-click export that maps the ProseMirror document model to Notion blocks via their API, preserving formatting

## Technical Details

The most interesting technical decision was the **streaming architecture**. Cloudflare Workers support streaming responses natively, so GPT-4's token stream is piped directly to the client without buffering. On the client, I wrote a ProseMirror plugin that progressively applies the streamed text as a series of transactions, so users see text appearing character by character in-place.

Doing this correctly required careful handling of the editor's transaction history: mid-stream insertions need to be treated as a single undoable unit rather than dozens of individual keystrokes. I built a custom `StreamTransaction` wrapper that batches all stream events and commits them as one history entry when the stream closes.

SvelteKit was chosen over Next.js here because the editor component needed fine-grained reactivity for collaborative cursor positions, and Svelte's compile-time reactivity model has zero overhead at runtime compared to React's reconciler — relevant when ProseMirror is already doing significant work on every keystroke.
