---
title: "Prediction Market Trader"
description: "Autonomous trading agent for specific Kalshi markets"
role: "Solo Developer"
year: "2026"
stack: ["Python", "Claude Agent SDK", "MCP", "Kalshi API"]
thumbnail: "/images/works/PredictionMarketTrader_ProjectImage.png"
images:
  - "/images/works/PredictionMarketTrader_ProjectImage.png"
featured: false
order: 4
---

## Overview

An autonomous Python agent that trades certain Kalshi prediction markets. The agent compares external forecasts against the implied probabilities Kalshi traders are paying, and buys whenever the model assigns a meaningfully higher probability to a bin than the market does.

The thesis is simple. These markets are dominated by retail traders whose intuition often disagrees with credible forecast. When the research says an event will happen tomorrow with low uncertainty but Kalshi is pricing the bin or event at 30¢, the math says there's edge. The agent finds those gaps, sizes a position, and places the trade, all on a daily cron with no human in the loop.

## The Problem

There's no off-the-shelf tool that ingests forecasts, translates them into a probability distribution over Kalshi's bin structure, sizes and executes trades under hard risk limits, and leaves a human-auditable rationale behind every decision. Building one means owning the full loop: forecast acquisition, probability modeling, edge detection, position sizing, risk gating, order execution, settlement, and calibration.

It also means making the system trustworthy enough to run with real money.  The design problem is as much about safety architecture as it is about alpha.

## What I Built

A hybrid system: a deterministic Python core that owns all the math and order flow, paired with two Claude Agent SDK agents that consume that core through MCP tools.

- **Deterministic spine**: forecast adapter, ensemble probability model, edge calculation, fractional Kelly sizing, multi-layer risk gate, and a paper-trading executor. This is the contract. The LLM never computes EV or sizes positions.
- **Trading agent**: orchestrates the daily pipeline through multiple MCP tools (such as list markets, get forecast, compute edge, size position, run risk check, place order). Adds legibility and a natural-language journal entry per run; alpha is identical to the deterministic script it sits on top of.
- **Discussion agent**: reads forecsat / research prose and emits a single bounded multiplier that adjusts forecast uncertainty up or down based on whether the forecaster sounds confident or hedged. Information-firewalled from the trading agent so it can never bias toward trades it "wants."
- **Five-layer safety model**: paper mode by default, deterministic risk caps re-validated by a hook before any order fires, dual kill-switch env vars, and a sticky drawdown hard-stop that survives restarts.
- **Backtest harness**: replays the entire fixture archive through the same pipeline so any threshold change can be A/B-tested against historical data before going live.
- **Calibration loop**: settlement cron pulls the actual observed result, marks each paper trade win/loss, and refits per-source forecast uncertainty from the growing residual dataset.

## The Approach

The interesting design decision was splitting the LLM work into two agents with disjoint tool surfaces. One naïve design would have a single agent both read discussions and place trades, but that agent could learn to bias its uncertainty estimates toward trades it sees pending. By making the discussion agent unable to see any market, price, or order tool, that failure mode is structurally impossible.

The other principle is that the LLM never owns load-bearing math. Edge, sizing, and risk are all in deterministic Python with unit tests. The agents add legibility on top (a readable journal explaining every decision) and extract signal from unstructured text the numbers can't carry (forecaster confidence). Everything else is the spine.

The system runs on six independent cron jobs that commit their output back to the repo, so the codebase itself is the source of truth for fixtures, journals, multipliers, and the audit log. The plan is two weeks of paper trading to hit calibration targets, then flip the switch.
