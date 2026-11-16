---
title: "Food or Friend?"
description: "Daily visual guessing game: is it an animal or food? Ten rounds, one life"
role: "Solo Developer"
year: "2026"
stack: ["Next.js", "React 19", "TypeScript", "Tailwind CSS", "Postgres", "Drizzle ORM", "Supabase", "Discord Embedded App SDK", "PostHog", "Vercel", "Playwright"]
thumbnail: "/images/works/FoodOrFriend_ProjectImage.jpg"
media:
  - type: "image"
    src: "/images/works/FoodOrFriend_ProjectImage.jpg"
    label: "Lookalike pairs from the image library"
  - type: "image"
    src: "/images/works/FoodOrFriend_Landing.jpg"
    label: "foodorfriend.com"
liveUrl: "https://foodorfriend.com"
featured: true
order: 7
---

## Overview

Food or Friend? is a daily visual guessing game built on one internet joke: some animals look exactly like food. Corgi rear or bread loaf? Curled-up seal or mochi? Every day, everyone gets the same ten images, each on a shrinking timer, and one wrong answer or timeout ends the run. A full run takes under a minute, and the result shares as a spoiler-free emoji trail, Wordle-style.

It runs on the web at foodorfriend.com and as a Discord Activity, where the channel becomes the scoreboard.

## The Problem

A daily game depends on two things: whether people come back tomorrow, and whether their result makes a friend curious enough to play. Both depend more on content and tuning than on code. The game is only fun if players feel tricked fairly - an image has to be genuinely ambiguous at a glance and obvious once revealed - and surviving all ten rounds has to be rare enough to brag about.

The product bet was that a sub-minute ritual could drive its own distribution: the share link is the ad, the results screen tells you where you stand among today's players, and the streak gives you a reason to come back.

## What I Built

- The daily game: ten rounds, one life, a timer that tightens from 3.5 to 1.75 seconds, keyboard controls, daily streaks, and a death screen that names the lookalike that got you. Images are preloaded and decoded before each round's timer starts, so a slow connection never causes a timeout.
- Spoiler-free sharing: share links carry an HMAC-signed payload (the round reached and the emoji trail, never the answers) that a serverless route renders into a dynamic Open Graph card. Opening a friend's link turns their run into a "beat me" comparison, with no database table or write endpoint behind it.
- Live standing: anonymous results, one row per player per challenge with no accounts or personal data, feed a "X% didn't get this far" percentile on the results screen. It's computed after the player's own row commits, so even the day's first finisher sees a standing.
- A Discord Activity: the same game inside Discord through the Embedded App SDK, with a per-channel board of who played today, a bot that posts as friends finish (batched to one new message per channel every two minutes), a next-day summary with a generated group card, and Discord-native share links that keep the "beat me" comparison working.
- A content pipeline and local content studio: sourcing from Pixabay, Pexels and Unsplash with photographer and license recorded per image, a dashboard for curation and scheduling, normalization to 800x800 WebP, and challenge assembly by difficulty tier. The library holds 246 curated images across 12 lookalike pairs.

## Technical Details

### Play never waits on the backend

Each day's challenge is baked to static JSON on the CDN, and the answers ship in the payload so the reveal is instant: inside a 1.75-second timer, reveal latency can't depend on the network. The play page never reads the database at request time. If the results API is unreachable, results queue in localStorage and retry, so a database outage hides stats but never blocks a run.

### Tuning with real data

The original timer curve ran from 5 seconds down to 1.75. Real results showed a 33% completion rate against a 5-10% design target, so the curve was tightened to start at 3.5 seconds, since the opening rounds were the most generous and did the least work. The 1.75-second floor stayed: below it, outcomes turn on device latency and reflexes rather than recognition.

### Making hard images without giving the game away

Stock libraries are built to show subjects clearly, so they hold few genuine lookalikes at the hard end. For the top difficulty tiers, the pipeline generates images instead, following rules learned from play. Each prompt asks for one ordinary subject posed to resemble the other thing ("a ginger cat curled into a crescent on a linen blanket"), never for a hybrid. Features are hidden with the pose instead of deleted. Both sides of a pair are always generated together, so "looks generated" never correlates with the answer and players keep judging food versus animal, not real versus AI.

### Discord without a gateway

The Discord side runs entirely over HTTP. Interactions are verified with Ed25519 against the app's public key, and a daily Vercel cron sends the channel summaries. Discord user IDs are never stored raw: an HMAC pepper turns them into the same anonymous client IDs the web uses, and deletion tombstones use a second, independent pepper. Separate kill switches can pause the Activity or the bot.

### Testing

Vitest unit tests, integration tests that apply the real Drizzle migrations to an in-process PGlite database, and Playwright end-to-end suites for the game, sharing and the Discord Activity, which runs against Discord's SDK mock.
