# Capture 11

Status: reference game / product candidate
Branch: `capture-11`
Price hypothesis: $1.99-$2.99 one-time

## One-sentence pitch
Build and capture combinations in a fast two-player card duel where every round is about setting traps, stealing value, and racing to 11 scoring points.

## Why it belongs in the engine
Capture 11 stresses:
- card/deck models
- deterministic shuffle
- turn state
- AI turns
- selectable actions
- scoring/results
- tutorial complexity
- save/settings without requiring online services

## Commercial-safe direction
Use a standard deck and original product name/UI/art/audio. Do not use casino branding that implies real-money gambling, wagering, chips, payouts, or cash rewards.

## V1 modes
- Player vs AI
- Pass-and-play 2 player
- Quick tutorial

## V1 shell dependencies
- title screen
- settings
- pause
- restart
- results/rematch
- audio controls
- accessibility preferences
- local preferences save

## Game-owned systems
- deck/cards
- board/build/capture state
- legal move generation
- AI heuristic
- score calculation

## First productization test
The existing branch must run its current automated rules tests before refactoring. Then extract shell-independent rule logic and prove a new front end can consume it without changing scoring/build/capture rules.
