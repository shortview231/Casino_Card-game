# Capture 11 Playtest Bug Log

This file is the running journal for bugs found during real playtesting. Do not fix entries merely because they are logged. Preserve the observed behavior first, gather reproduction evidence, then address bugs in a separate fix pass.

## BUG-001 — Paired/fixed build rejects matching target card

- **Status:** FIXED IN CODE — PENDING ITCH.IO RECHECK
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

### Regression coverage

- Unit coverage confirms played `3` plus loose `4` and loose `7` creates one locked BUILD 7 while another 7 remains in hand.
- Value-independent unit coverage retains the BUILD 9 case using `2 + 7` plus loose `9`.
- Chromium desktop and mobile coverage uses deterministic seed `142` to make and render the required locked BUILD 7 through the actual game controls.
- The fix remains pending Robert's confirmation in the redeployed itch.io build.

## BUG-002 — Simultaneous locked-build + loose-value capture rejected

- **Status:** FIXED IN CODE — PENDING ITCH.IO RECHECK
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

### Regression coverage

- Unit coverage confirms a played 10 captures an existing locked BUILD 10 plus loose `9 + A` atomically, including every selected and played card.
- Additional unit coverage confirms a played 7 captures BUILD 7 plus loose `3 + 4`, making the fix value-independent.
- Chromium desktop and mobile coverage uses deterministic seed `1848` to form BUILD 10, select it with loose `9 + A`, expose the combined-capture action, and collect all five cards through the actual game controls.
- The fix remains pending Robert's confirmation in the redeployed itch.io build.

## BUG-003 — Mobile layout loads but is effectively unplayable

- **Status:** FIXED IN CODE — PENDING REAL DEVICE / ITCH.IO RECHECK
- **Found:** 2026-09-07
- **Environment:** live itch.io HTML5 build on a phone/mobile browser
- **Deployed game commit:** `9f1df190f69a6fe0bfc5ce5cf8c0f57743bb6214`
- **Reporter:** Robert Sory
- **Severity:** Release blocker for mobile

### What happened

The live game successfully launches on mobile, so the HTML5 build is technically compatible with a phone browser. Once gameplay opens, however, the mobile presentation is not practically usable.

Robert reported:

- the game appears excessively zoomed/cropped on the phone
- the full gameplay surface and controls cannot be reached comfortably
- normal page scrolling does not expose the missing portions of the interface
- the result is effectively impossible to play even though the game itself loaded

### Expected behavior

A phone user should be able to open the same Capture 11 URL, enter gameplay, see readable cards and state, select cards/builds by touch, reach the available turn actions, and move through an entire match without needing desktop mode or an orientation workaround.

The mobile layout may reorganize the desktop cockpit into a single-column/stacked experience, but it must preserve the approved visual language and low-vision readability rather than simply shrinking the desktop UI until it fits.

### Investigation notes

- `index.html` already contains `width=device-width, initial-scale=1.0`, so do not assume a missing viewport meta tag is the cause.
- Current CSS switches to a stacked mobile layout at `46rem` and to another layout at `32rem`.
- At `32rem`, `.right-rail` changes to `display: flex` without an explicit column direction; inspect whether this creates horizontal expansion or contributes to the zoom/crop failure.
- Do not rely on the outer itch.io page to provide scrolling. If gameplay can exceed the mobile viewport, Capture 11 itself must provide a reliable touch-scrollable path to every required control.
- Preserve desktop behavior while fixing mobile.

### Fix and regression coverage

- Phone gameplay now owns a viewport-height vertical scroll container, so touch scrolling does not depend on the surrounding itch.io page.
- Portrait gameplay places live turn actions directly after the player's hand and keeps the informational rail below the primary play loop.
- Mobile cards and chrome were compacted without scaling the desktop cockpit or reducing normal-scale touch targets below 64 px wide.
- Chromium interaction coverage at `390x844` creates a locked BUILD 7 through the real controls, scrolls to its action, advances the CPU turn, and checks global width containment.
- Chromium interaction coverage at `360x800` selects a hand card, scrolls to and activates a legal trail action, and confirms normal turn advancement.
- Additional checks cover `412x915`, `844x390` landscape, and `390x844` at 150% app text scale; all retain internal scrolling and no page-wide horizontal overflow.
- A touch-host regression uses a `1280x800` CSS viewport with coarse pointer input to reproduce the embedded-host failure mode; the game now switches to the stacked flow, scrolls to the hand, exposes the action, and advances the turn.
- Desktop Chromium inspection at `1280x800` confirms the existing three-column cockpit and desktop action rail remain active.
- The fix remains pending Robert's confirmation on the redeployed itch.io build using a real phone.

## BUG-004 — Matching played rank captures only one of multiple loose matching cards

- **Status:** OPEN — REPORTED, DO NOT AUTO-FIX
- **Found:** 2026-09-08
- **Environment:** live itch.io HTML5 build on Robert's phone
- **Reporter:** Robert Sory
- **Severity:** Gameplay rules bug, non-blocking

### Reproduction

- Player has an `8` in hand.
- Board contains two separate loose `8` cards.
- Player plays the `8` and attempts to capture both loose `8`s in the same move.
- The game only permits one of the two board `8`s to be captured.

This can occur naturally from the opening deal, so it is uncommon but not exotic.

### Expected behavior

A matching played card should be able to capture all independently matching loose cards selected for that play when each selected card is a legal same-rank/value capture group.

For the reproduced example, the played `8` should be able to collect both loose board `8`s, resulting in all three 8s entering the player's captured pile.

### Actual behavior

The engine/UI only allows one matching loose `8` to be selected/captured with the played `8`, leaving the other loose `8` on the board.

### Investigation note

Track this separately from BUG-002 until proven otherwise. It may share the same underlying multi-group capture logic, but this failure involves multiple independent same-value loose cards rather than a locked build plus an arithmetic loose-card group.
