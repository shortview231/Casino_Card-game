# Capture 11 Next Move

## Visual authority

The approved desktop game-table reference remains:

`docs/ui-reference/capture11-final-ui-goal.jpg`

Preserve the current polished dark card-game visual language. This task is a **mobile usability adaptation**, not a desktop redesign and not a generic responsive shrink pass.

## Current task: make the live Capture 11 game genuinely playable on phones

Read `PLAYTEST_BUG_LOG.md` first, especially **BUG-003**.

Robert verified that the itch.io build launches on mobile, but gameplay is effectively unusable because the phone presentation appears overly zoomed/cropped and the missing gameplay/control areas cannot be reached through normal scrolling.

The goal is not merely to make automated mobile screenshots pass. The goal is for a real phone user to be able to complete a Capture 11 match by touch.

## Root-cause audit before editing

Reproduce the current failure in Chromium using real phone-sized viewports, at minimum:

- `360x800`
- `390x844`
- `412x915`
- one landscape phone viewport such as `844x390`

Inspect the actual rendered width/height, horizontal overflow, scroll containers, sticky/fixed elements, and touch reachability.

Important known facts:

- `index.html` already has `width=device-width, initial-scale=1.0`; do not add duplicate viewport metadata.
- `src/games/capture11/capture11.css` switches to stacked layout below `46rem`.
- below `32rem`, `.right-rail` currently becomes `display: flex` without an explicit column direction. Verify whether this is forcing horizontal expansion or contributing to the zoom/crop issue.
- do not assume the outer itch.io page will provide scrolling. The game must remain usable when hosted inside a constrained/fullscreen mobile HTML5 viewport.

## Mobile interaction and layout requirements

Implement the smallest coherent mobile redesign needed to satisfy all of these:

1. **No page-wide horizontal overflow.** At supported phone widths, the Capture 11 gameplay surface must fit the viewport width.
2. **Reliable touch scrolling.** If the complete game is taller than the phone viewport, the game itself must provide a normal vertical touch-scroll path to every required area. No trapped viewport and no inaccessible bottom controls.
3. **Readable, not microscopic.** Do not solve the problem by scaling the entire desktop UI down. Cards, rank/suit cues, score, selected states, and action labels must remain readable for low-vision users.
4. **Playable ordering.** Mobile should prioritize the gameplay loop. A player must be able to reach CPU state, board, own hand, and legal turn actions without hunting through decorative/informational panels. Reorder panels on mobile if necessary while preserving desktop placement.
5. **Four-card hand is usable by touch.** All four possible hand cards must fit/wrap cleanly, remain individually tappable, and never force global horizontal scrolling.
6. **Board selections and builds are usable.** Loose cards, open builds, locked builds, and large grouped builds must remain selectable/readable. A build may use its own contained horizontal scrolling when necessary, but the whole game may not become horizontally scrollable.
7. **Action controls stay reachable.** After selecting a hand card or board cards/builds, the available action button(s) must be reachable by touch without changing browser zoom or switching to desktop mode.
8. **CPU preview does not block play.** The CPU reveal/last-play presentation must fit or stack on mobile without covering the board or trapping scrolling.
9. **Menu remains functional.** Main menu, How to Play, Accessibility, and Play vs CPU must remain usable on the same phone widths.
10. **Portrait first, landscape still usable.** Portrait is the priority; landscape must at least remain scrollable and playable rather than clipped.

## Accessibility requirements

- preserve visible keyboard focus for desktop/tablet users
- preserve high-contrast mode and reduced-motion behavior
- keep touch targets at least the existing practical button/card sizes where possible
- verify at the normal text scale and at the app's 150% text scale that required controls remain reachable; controlled vertical growth is acceptable, global horizontal overflow is not
- do not disable browser pinch zoom

## Desktop regression guardrail

The current desktop itch.io presentation is approved and must remain intact.

Verify at minimum:

- `1280x800` desktop gameplay still uses the current three-column cockpit
- desktop card sizes and approved visual hierarchy do not regress
- BUG-001 and BUG-002 regression tests remain green
- scoring, CPU strategy, rules, builds, diagnostics, and menu behavior are unchanged unless directly required for mobile layout

Do **not** change AI difficulty in this task.
Do **not** change Capture 11 family rules in this task.
Do **not** redesign the desktop UI.
Keep port `8765` untouched.

## Required browser acceptance test

Add Playwright coverage that does more than assert elements exist.

At a phone viewport, drive the game through the real controls and verify:

- menu opens and Play vs CPU starts gameplay
- document/gameplay width does not exceed viewport width beyond normal rounding tolerance
- the page/game container can scroll vertically when content is taller than the viewport
- player can tap a hand card
- player can reach and tap a legal action
- after the action, gameplay advances normally
- action controls and player hand are reachable through actual scrolling
- open/locked build rendering does not create global horizontal overflow

Run at least one complete deterministic mobile interaction path at `390x844` and a second width such as `360x800` or `412x915`.

## Verification

Run the full existing suite, including at minimum:

- `npm run typecheck`
- `npm test`
- `npm run test:stress`
- `npm run build`
- full Playwright e2e/browser/accessibility suite

Then inspect the result in a real Chromium mobile viewport, not only test assertions.

## Bug journal update

If the mobile acceptance criteria pass locally, update BUG-003 to:

`FIXED IN CODE — PENDING REAL DEVICE / ITCH.IO RECHECK`

Record the viewport sizes and interactive checks used. Do not mark it fully VERIFIED until Robert confirms the redeployed game on his actual phone.

## Commit, push, and redeploy

When all verification passes:

1. commit the mobile fix, tests, and bug-log update
2. push to `capture-11-rebuild-v0.1`
3. report the exact pushed SHA
4. trigger the existing `.github/workflows/deploy-itch.yml` workflow in the same run if GitHub Actions authentication permits it

Deployment parameters remain:

- ref: `capture-11-rebuild-v0.1`
- `itch_target`: `robert-sory/capture-11`
- `channel`: `html5`
- `confirm`: `DEPLOY`

If Actions permission is available, run the equivalent of:

`gh workflow run deploy-itch.yml --ref capture-11-rebuild-v0.1 -f itch_target=robert-sory/capture-11 -f channel=html5 -f confirm=DEPLOY`

Then watch the deployment through completion and report the result.

If authentication cannot trigger the workflow, stop after the verified push and report that clearly. Do not alter credentials, create another itch.io project, or expose `BUTLER_API_KEY`.
