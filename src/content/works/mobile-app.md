---
title: "Mobile Finance App"
description: "Cross-platform personal finance app with AI-powered spending insights and budget tracking."
role: "Full-Stack Engineer"
year: "2024"
stack: ["React Native", "Expo", "Supabase", "OpenAI"]
thumbnail: "/images/works/mobile.png"
images: []
featured: true
order: 4
---

## Overview

A personal finance app shipped to iOS and Android that aggregates bank transactions, categorizes spending automatically, and uses GPT-4 to surface actionable insights in plain language. The app reached 2,000 active users organically within three months of launch, without paid acquisition.

The core insight driving the product: existing finance apps show you data but don't tell you what to do with it. We wanted the experience to feel less like a spreadsheet and more like a conversation with a financially literate friend.

## The Problem

Personal finance apps have a usability paradox: the people who need them most are the ones least likely to spend time learning a complex tool. Most apps require manual transaction categorization, weekly review rituals, and prior knowledge of budgeting frameworks to be useful.

The challenge was: how do you make financial awareness effortless for someone who has never made a budget?

## What I Built

- **Automatic transaction sync** via Plaid integration — users connect their bank accounts once and all historical and live transactions are imported and categorized
- **AI spending analysis** — a GPT-4 powered pipeline summarizes monthly spending patterns, compares them to prior months, and generates specific, actionable recommendations (e.g. "Your dining spend is 40% higher than last month — you had 3 restaurant visits over $80 each")
- **Natural language queries** — users can ask questions like "How much did I spend on subscriptions this year?" and get an answer in seconds
- **Budget scaffolding** — the app proposes a starter budget based on the user's actual spending history rather than generic percentages
- **Offline-first architecture** — all data is cached locally with conflict-free sync when connectivity returns

## Technical Details

The trickiest engineering work was the **transaction categorization pipeline**. Plaid provides raw merchant names (often cryptic, like "SQ *BLUEBOTTLE SF") that need to be mapped to meaningful categories. We built a two-stage system: a local classifier using TF-IDF features handles 85% of transactions instantly, and the remaining 15% (ambiguous or new merchants) are processed asynchronously by a GPT-4 call with a carefully engineered prompt and few-shot examples.

The result is 94% categorization accuracy across 60+ categories, with the cost of the AI calls amortized to under $0.003 per user per month.

On the React Native side, I used a custom navigation architecture that preloads the most likely next screen during idle time, reducing perceived navigation latency to near-zero. Combined with Reanimated 3 for gesture-driven animations, the app feels genuinely native rather than web-in-a-shell.
