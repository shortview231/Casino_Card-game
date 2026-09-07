# Capture 11 Playtest Bug Log

This file is the running journal for bugs found during real playtesting. Do not fix entries merely because they are logged. Preserve the observed behavior first, gather reproduction evidence, then address bugs in a separate fix pass.

## BUG-001 — Valid multi-card / stacked build rejected

- **Status:** OPEN
- **Found:** 2026-09-07
- **Environment:** itch.io embedded HTML5 build, external-site playtest
- **Deployed game commit:** `e7718d76a649347e6aee2fb1e577edd1739f7f5d`
- **Hand:** 1
- **Deck remaining:** 16
- **Reporter:** Robert Sory
- **Severity:** Gameplay / rules blocker

### What happened

During a live hand on itch.io, the game rejected a build/stack selection that Robert expected to be legal. The UI displayed:

> Those board cards do not make a legal capture or build. You can still play your selected hand card to the table.

Robert had already made a similar multi-card build earlier in the same testing session and was able to grow it to roughly a seven-card stack, so this rejection is inconsistent with behavior that had already worked.

### Visible state in the screenshot

- Player hand included: `3♥`, `10♦`, `4♣`, `8♠`
- Selected hand card: `10♦`
- Board visibly included: `9♣`, `K♣`, `6♣`, `10♠`, `A♠`
- The screenshot shows board selections around the cards involved in the attempted play.
- CPU had 15 captured cards; player had 8 captured cards.

### Expected behavior

The game should allow the same legal stacked/multi-group build behavior that worked earlier in the session, including adding cards/groups toward the held target when the family rules permit it.

### Actual behavior

The engine rejected the selected board combination as neither a legal capture nor a legal build.

### Notes for later investigation

- Do **not** change the rules or code yet.
- First reproduce the exact selection and compare it with the earlier successful multi-card stack case.
- Capture the playtest seed/move log if the issue occurs again.
- Check whether the rejection depends on the presence of an existing target-value loose card, multiple equal-value groups, or the exact paired/locked-build path.
- Treat Robert's report that this pattern is legal under the family rules as authoritative for the bug log. The exact engine condition causing the rejection remains unknown.
