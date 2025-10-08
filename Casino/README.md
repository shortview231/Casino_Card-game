# Caino / Casino (2-Player Card Game)

A Python 3.13 implementation of a 2-player Casino-like card game, with a clean engine, a CLI for quick playtesting, and a Tkinter UI prototype.

## Quick Start

- Run CLI: `python -m casino.cli`
- Launch Tkinter UI: `python -m casino.ui_tk`
- Run tests: `pytest -q`

## Rules Summary

- Standard 52-card deck.
- Values: A=1; 2–10=pip; J/Q/K=10 (configurable in `casino/cards.py`).
- Opening deal: 4 to each player, 4 to board. After both hands empty and deck remains, deal 4 to each (no new board cards). Continue until deck is exhausted.
- Turn: play exactly one card as Discard, Build, or Capture.
- Build: combine your hand card with loose board cards to set a target. You may only create/extend a build if you also hold a separate card matching the target. Opponent may extend to a higher target if they hold the new target. Capture a build only by playing a card equal to the target.
- Capture: use one hand card to take either (a) one loose card of equal value, (b) a set of loose cards summing to the hand card, or (c) one build matching the value.
- Scoring: Aces 1 each; 2♠ 1; 10♦ 3; most spades 1; most cards 2. Total 11 points.

## Architecture

- `casino/cards.py`: Card, Deck, config.
- `casino/rules.py`: PointsConfig and constants.
- `casino/engine.py`: Core rules, moves, flow, scoring.
- `casino/ai.py`: Simple heuristic AI.
- `casino/cli.py`: Text loop vs AI.
- `casino/ui_tk.py`: Tkinter prototype with red felt.
- `tests/`: Pytest suite covering deal, builds, capture, scoring.

## Notes

- Engine is UI-agnostic. UI constructs a `Move` and calls `apply_move`.
- Deterministic shuffle supported via `seed`.
