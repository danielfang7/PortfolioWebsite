---
title: "FitCheck"
description: "Gamified social fashion app with AI-powered outfit scoring"
role: "Founder"
year: "2026"
stack: ["React Native", "Expo", "TypeScript", "Postgres", "Edge Functions", "Claude API", "TanStack Query", "APNs"]
thumbnail: "/images/works/FitCheck_ProjectImage.png"
images:
  - "/images/works/FitCheck_ProjectImage.png"
liveUrl: "https://fitcheck.app"
featured: true
order: 6
---

## Overview

FitCheck is a gamified social fashion mobile app where users post their daily outfit, get instant AI style analysis with a 5-dimension fit score and tailored feedback, and rate, comment on, and follow friends in a friends-first feed. The product is a React Native (Expo) iOS-first client backed by our own backend (Postgres, auth, storage, and edge functions), with a Claude vision model handling the scoring rubric server-side.

The challenge wasn't just shipping another social photo app. It was building a daily habit loop where every post produces immediate, structured, useful feedback, and where the social layer optimizes for outfit quality and taste rather than attractiveness validation.

## The Problem

People who care about style face three problems. They lack fast, actionable feedback. Most don't know whether an outfit works, why it works, or how to improve it. Style improvement is unstructured. Advice is scattered across TikTok, Pinterest, friends, and trial and error, with no daily system for getting better. And existing fashion social loops tend to drift toward attractiveness validation rather than outfit quality, styling, and taste.

The product question was: can a single daily ritual (post a fit, get an AI score, see and rate friends' fits) turn an existing behavior (getting dressed and seeking validation) into a structured improvement loop without becoming yet another thirst feed?

## What We Built

A production iOS app and backend with:

- React Native (Expo SDK 54, RN 0.81, React 19) client with file-based navigation across Feed, Discover, Upload, Profile, and Leaderboard tabs
- Daily outfit posting flow - full-body image upload with optional caption, context tag (work, casual, date, streetwear, formal, gym, going out), and per-post privacy mode (public, friends, private) enforced via row-level security
- AI Fit Analysis - overall score plus five sub-scores (Color Harmony, Cohesion, Originality, Styling Detail, Silhouette), style tags, written explanation, and concrete item-level recommendations, all returned within seconds of upload
- Friends-first Feed with inline likes, 1-10 ratings, comments, and quick-tag reactions, plus a Discover tab sorted by popularity for finding new creators outside the social graph
- Instagram-style Profile with photo grid, follower/following counts, score history chart, and per-post detail (AI score, sub-scores, feedback, user ratings, comments)
- Apple, Google, and email-OTP sign-in, push notifications (likes, ratings, follows) via APNs, and a moderation pipeline that constrains comments and prioritizes outfit-level feedback over body or face commentary

## Technical Details

### Architecture

The stack runs an Expo client against our backend. Postgres is the single source of truth. Edge functions sit between the client and external services so API keys never ship in the bundle.

```
Expo client (RN, file-based router, React Query)
  → Auth / Storage / Postgres / Edge Functions
  → scoring function → Claude API (vision)
  → notifications function → APNs
```

### AI Scoring Pipeline

The client uploads the photo to backend storage, inserts a post row, then calls the scoring edge function with the base64 image and context tag. The function forwards to the Claude API via the Anthropic SDK with a system prompt that defines the 5-dimension rubric and calibration rules. The function returns the scores plus written feedback, and the client patches the post row. Context tag is passed as background framing for feedback, not as a scored dimension.

### Feed and Social Layer

Feed queries are packaged as database RPCs so the client makes a single round-trip per refresh, with denormalized like counts, follower-only visibility, and per-user rating state all resolved server-side. The post's like count is maintained by a database trigger to keep feed reads cheap, with a regression test covering the trigger.

Likes, follows, comments, and ratings flow through normal backend tables. Database triggers write notification payloads and call the notifications edge function via an HTTP extension and a service-role JWT stored as a server secret. APNs push is fired directly from the function using a short-lived JWT, so notifications stay consistent with database state without a third-party push service in the loop.

### Client State and Image Pipeline

Server state is managed end-to-end with React Query. Feed, profile, post, comments, and social graph data all live in custom hooks. Local UI state uses a lightweight store. Image capture runs through standard Expo image picker and manipulator libraries for resize and base64 encoding before upload, and the React Native animation library drives the scoring reveal animation while the model is thinking.

### Schema Integrity and Testing

Migrations are idempotent so they apply cleanly against both fresh local databases and production. Row-level security policies enforce visibility (public, friends, private), follower-only content, and per-user writes. Service-layer tests run under a unit test runner with the backend client mocked, and database-level regression tests cover triggers and constraints that are awkward to assert from the client.
