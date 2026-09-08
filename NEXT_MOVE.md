# Capture 11 Next Move

## Source of truth

Read `ONBOARDING_TUTORIAL_PLAN.md` and `PLAYTEST_NOTES.md` before editing.

The approved desktop game-table reference remains:

`docs/ui-reference/capture11-final-ui-goal.jpg`

Preserve the polished desktop cockpit and the mobile playability work deployed from commit `2358c296fcbd04dcbd5104d85333affe14a1364a`.

## Current task: contextual first-turn guidance only

Implement **Layer 1: first-turn contextual guidance** from `ONBOARDING_TUTORIAL_PLAN.md` inside normal Play vs CPU.

Do not implement the separate Guided Tutorial mode in this task. That is the next layer after contextual guidance is verified.

### Required behavior

1. On a new player's first normal match, show a compact helper adjacent to the active gameplay area.
2. Before card selection, clearly say: `1. Pick a card from your hand.`
3. After a hand card is selected, clearly say: `2. Select cards on the table that your card can take, or choose an available build.`
4. When a legal action is available, clearly say: `3. Choose the highlighted action to finish your move.`
5. Keep this clarification visible in the helper: `11 is the match score to win. Your individual plays do not need to add to 11.`
6. Provide a **Show me** or **Hint** control that points to one legal next interaction without automatically playing a card or action.
7. Provide a **Hide tips** control. Persist that preference so experienced players are not forced through guidance on later visits.
8. Preserve invalid-selection recovery and explain the next valid step in plain language.
9. Do not hide illegal cards. Use a clear non-color-only cue for suggested/legal next choices.
10. Keep the normal Play vs CPU flow immediate; do not add a blocking modal.

### Mobile and accessibility requirements

- The helper and hint must use the corrected game-owned mobile scroller.
- At `360x800`, `390x844`, `412x915`, and `390x844` with 150% app text, guidance, cards, and actions must remain reachable with no page-wide horizontal overflow.
- The helper must not cover the board, hand, CPU preview, or actions.
- Preserve keyboard focus, high contrast, reduced motion, and screen-reader labels/live behavior.
- Suggested targets must use text or another semantic cue in addition to color.

### Guardrails

- Do not change Capture 11 rules, scoring, dealing, CPU difficulty, or AI strategy.
- Do not redesign the desktop table or main menu.
- Do not implement Guided Tutorial lessons yet.
- Keep BUG-001 and BUG-002 regressions green.
- Keep BUG-003 at `FIXED IN CODE — PENDING REAL DEVICE / ITCH.IO RECHECK` until Robert tests the deployed build on a real phone.
- Keep port `8765` untouched.

## Required tests

Add focused unit/browser coverage for:

- helper step transitions from hand selection to board/action guidance
- Hint/Show me identifies a legal next interaction without playing it
- Hide tips persists across reload and can be restored from Settings or an equally discoverable existing preference surface
- keyboard operation and semantic/non-color-only suggested-target cues
- normal and 150% mobile reachability/width containment
- existing mobile, BUG-001, BUG-002, menu, and accessibility paths remain green

Run the full repository verification suite and inspect real Chromium screenshots at desktop and phone sizes before reporting success.

## Completion

When verified:

1. commit and push to `capture-11-rebuild-v0.1`
2. update the relevant playtest/product notes with exact verification
3. trigger and watch `.github/workflows/deploy-itch.yml` using the existing `robert-sory/capture-11` / `html5` target if GitHub Actions authentication permits
4. report the pushed SHA and workflow result

Do not expose credentials or create another itch.io project.
