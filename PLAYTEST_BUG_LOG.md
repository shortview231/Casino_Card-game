# Capture 11 Playtest Bug Log

This file is the running journal for bugs found during real playtesting. Do not fix entries merely because they are logged. Preserve the observed behavior first, gather reproduction evidence, then address bugs in a separate fix pass.

## BUG-001 — Paired/fixed build rejects matching target card

- **Status:** OPEN — REPRODUCED / CONSISTENT PATTERN
- **Found:** 2026-09-07
- **Environment:** itch.io embedded HTML5 build, external-site playtest
- **Deployed game commit:** `e7718d76a649347e6aee2fb1e577edd1739f7f5d`
- **Reporter:** Robert Sory
- **Severity:** Gameplay / rules blocker

### Family rule involved

When a new group is built to a target value and there is also a loose board card already equal to that target, that matching card belongs in the same fixed/paired build. The build is then locked at that target and is not raisable.

Example pattern: a target 7 may contain one group totaling 7, such as `3 + 4`, plus a separate loose `7`. If the player still holds a `7` as the pickup card, those groups should be combined into a locked/fixed 7 build.

### First observed failure

During a live hand on itch.io, the game rejected a build/stack selection that Robert expected to be legal. The UI displayed:

> Those board cards do not make a legal capture or build. You can still play your selected hand card to the table.

Visible state in the screenshot:

- Player hand included: `3♥`, `10♦`, `4♣`, `8♠`
- Selected hand card: `10♦`
- Board visibly included: `9♣`, `K♣`, `6♣`, `10♠`, `A♠`
- CPU had 15 captured cards; player had 8 captured cards.

Robert had already made a similar multi-card stack earlier in the same testing session and was able to grow it to roughly seven cards, so the failure appeared inconsistent.

### Second reproduction / consistent pattern identified

Robert reproduced the problem in a clearer paired-build scenario:

- Player hand included a `7` and a `3`.
- Board contained a loose `7`, a `4`, and a `3`.
- The intended play was to create a target-7 build using a `3 + 4 = 7` group while also including the loose board `7` as the second equal-value group.
- Under the family rule, the presence of the matching loose `7` should make this a fixed/paired 7 build while the player still holds the pickup `7`.
- The game would allow the arithmetic group but effectively forced the matching loose `7` to be ignored instead of including it in the locked build.

Robert reports this same failure pattern occurs specifically when a loose board card already equals the intended build total. This makes BUG-001 reproducible rather than a one-off selection error.

### Expected behavior

If the player legally creates a target value and another loose board card already equals that same target, the game should allow both equal-value groups to be combined into the fixed/paired build, provided the player still holds the pickup card required by the family rules.

For the reproduced 7 example, the legal locked build should contain:

- group 1: loose `7`
- group 2: `3 + 4 = 7`
- target: `7`
- state: fixed/paired, not raisable

### Actual behavior

The engine accepts or recognizes the arithmetic group but rejects/omits the separate loose card whose value already equals the target, preventing the legal fixed/paired build from being formed correctly.

### Notes for later investigation

- Do **not** change the rules or code yet.
- Treat this as a consistent paired/fixed-build handling bug.
- Reproduce with several targets, for example 5, 7, and 10, to confirm it is value-independent.
- Compare the legal-move generation path for open builds versus paired/fixed builds when a loose board card exactly equals the target.
- Capture the playtest seed/move log if convenient on the next occurrence.
- Robert's family-rule description is authoritative for this bug log.

## BUG-002 — Simultaneous locked-build + loose-value capture rejected

- **Status:** OPEN — FIRST OBSERVATION
- **Found:** 2026-09-07
- **Environment:** itch.io embedded HTML5 build, external-site playtest
- **Deployed game commit:** `e7718d76a649347e6aee2fb1e577edd1739f7f5d`
- **Reporter:** Robert Sory
- **Severity:** Gameplay / rules blocker

### Visible state

In hand 2, the player had a single `10♣` remaining in hand.

The board visibly contained:

- a **locked BUILD 10** containing `10♦` and `10♠`
- loose `9♣`
- loose `A♠`
- loose `8♣`
- loose `5♥`
- loose `K♣`

The selected objects were the player's `10♣`, the locked BUILD 10, `9♣`, and `A♠`.

### Problem visible in the screenshot

Both selected board groups independently match the played value 10:

- locked BUILD 10 = `10`
- loose `9♣ + A♠ = 10`

The UI nevertheless displayed:

> Those board cards do not make a legal capture or build. You can still play your selected hand card to the table.

### Why this appears different from BUG-001

BUG-001 occurs while **forming or extending a paired/fixed build** when a loose card already equals the target.

This observation occurs during a **capture attempt**. The build already exists and is already locked. The failure appears to be in selecting a matching build and an additional loose-card group that also equals the played card value during the same capture.

The two bugs may ultimately share legal-selection code, but they are being tracked separately until the engine behavior is investigated.

### Expected behavior to preserve for investigation

Robert identified this board state as a problem during live playtesting. The apparent intended capture is for the played `10♣` to take the locked BUILD 10 and the separate `9♣ + A♠ = 10` group in the same play.

### Actual behavior

The engine rejects the combined selection as illegal instead of offering the capture.

### Notes for later investigation

- Do **not** fix yet.
- Reproduce with another target value, for example a BUILD 7 plus loose `3 + 4`, while playing a 7.
- Check whether the engine currently permits only one capture source type at a time: loose cards OR a build.
- Compare `movesForExactSelection` / legal move generation for combined build and loose-card selections.
- Keep BUG-002 separate from BUG-001 unless code investigation proves they are the same root cause.
