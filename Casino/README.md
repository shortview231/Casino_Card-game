# Capture 11

Capture 11 is the working title for the existing 2-player Casino-like card game. This branch preserves the original game as a standalone product candidate while the repository's main line evolves into a reusable Microgame Engine.

## Product hypothesis

- Working name: **Capture 11**
- Short name: **Cap 11**
- Product class: Microgame
- Price hypothesis: **$1.99-$2.99 one-time**
- Initial distribution hypothesis: browser/desktop through a zero-upfront-cost storefront such as itch.io, with additional stores considered only after evidence supports them.
- Commercial rule: original branding/art/audio only. Do not depend on third-party game IP.

## Current implementation

A Python 3.13 implementation of a 2-player Casino-like card game, with a clean engine, CLI playtesting, a Tkinter UI prototype, simple AI, deterministic shuffle support, and automated tests.

### Quick Start

- Run CLI: `python -m casino.cli`
- Launch Tkinter UI: `python -m casino.ui_tk`
- Run tests: `pytest -q`

## Rules Summary

- Standard 52-card deck.
- Values: A=1; 2-10=pip; J/Q/K=10 (configurable in `casino/cards.py`).
- Opening deal: 4 to each player, 4 to board. After both hands empty and deck remains, deal 4 to each (no new board cards). Continue until deck is exhausted.
- Turn: play exactly one card as Discard, Build, or Capture.
- Build: combine your hand card with loose board cards to set a target. You may only create/extend a build if you also hold a separate card matching the target. Opponent may extend to a higher target if they hold the new target. Capture a build only by playing a card equal to the target.
- Capture: use one hand card to take either (a) one loose card of equal value, (b) a set of loose cards summing to the hand card, or (c) one build matching the value.
- Scoring: Aces 1 each; 2 of Spades 1; 10 of Diamonds 3; most spades 1; most cards 2. Total 11 points.

## Architecture

- `casino/cards.py`: Card, Deck, config.
- `casino/rules.py`: PointsConfig and constants.
- `casino/engine.py`: Core rules, moves, flow, scoring.
- `casino/ai.py`: Simple heuristic AI.
- `casino/cli.py`: Text loop vs AI.
- `casino/ui_tk.py`: Tkinter prototype.
- `tests/`: Pytest suite covering deal, builds, capture, scoring.

## Productization path

1. Preserve current rules engine and tests.
2. Separate Capture 11 game rules from reusable shell/services.
3. Move shared shell capabilities into the Microgame Engine contract.
4. Replace prototype presentation with original commercial-safe art/audio/UI.
5. Add tutorial, quick restart, pause/settings, accessibility settings, save/preferences, and clean result screen.
6. Produce browser-first or lightweight desktop build depending the engine spike outcome.
7. Run a small external fun/usability test before commercial release.

## Relationship to Microgame Engine

This branch is the first reference game for the reusable engine. Capture 11 should consume shared services rather than owning menu/input/save/audio/accessibility/release plumbing itself.
