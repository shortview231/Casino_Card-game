# Capture 11 Next Move

## Guided Demo implementation — 2026-09-10

The reusable six-scene Guided Demo / Scenario Mode is implemented and locally verified. Named scenario states live in `src/games/capture11/scenarios.ts` and use normal exact-selection, move application, final sweep, and scoring paths.

Local verification passed:

- 66 unit tests and 2 stress tests through `npm run verify:core`
- production build
- 32 desktop/mobile Chromium tests, including all six demo scenes, BUG-004 through the UI, final sweep/scoring, replay/exit isolation, accessibility scan, and 150% phone text containment
- actual desktop and phone screenshots inspected

The only remaining acceptance work is manual live testing of the deployed demo on Robert's intended phone and tablet. Confirm that scene instructions, marked targets, controls, and final scoring remain comfortable inside the itch.io embed.

## Source of truth

Repository: `shortview231/Casino_Card-game`
Branch: `capture-11-rebuild-v0.1`

Read `AGENTS.md`, `PLAYTEST_BUG_LOG.md`, and `GUIDED_DEMO_MODE_PLAN.md` before editing.

## Release pass completed — 2026-09-10

BUG-004 verification and deployment are complete.

- Deployed commit: `d9209ea35545e20700d05ec06ad186aff92e3f75`.
- Local verification: full core suite (58 tests, plus 2 stress tests), production build, and all 26 Chromium desktop/mobile browser tests passed. Actual capture-ready screenshots were inspected.
- GitHub deployment succeeded, including core/browser verification and the itch.io upload: https://github.com/shortview231/Casino_Card-game/actions/runs/34553118094
- Existing target: `robert-sory/capture-11:html5`.

## Current next move: live release recheck

Robert should recheck BUG-004 on the deployed itch.io build: play an 8 to capture two loose 8s, and an 8 to capture loose 8 + 3 + 5 when those situations arise. Keep BUG-004 fixed in code, pending live recheck until that confirmation arrives.

After the sellable build is confirmed stable, the next product feature is the guided demo described in `GUIDED_DEMO_MODE_PLAN.md`. Do not implement it as part of this release verification pass.

## Completed release scope (reference)

Do not start new mobile work or build the tutorial in this task.

The only gameplay fix to finish now is BUG-004: a played numeric card must be able to capture multiple independent loose groups that each equal the played value.

Examples that must work:
- played 8 + loose 8 + loose 8 => capture both loose 8s
- played 8 + loose 8 + loose 3 + loose 5 => capture all three loose cards because the board contains two independent groups worth 8

An implementation and regression tests for this were already added before this NEXT_MOVE update. Inspect the current branch and preserve/reuse that work rather than reimplementing blindly.

## Required work

1. Verify the current BUG-004 implementation in `src/games/capture11/rules.ts`.
2. Verify the regression coverage in `tests/unit/capture11.multigroup-capture.test.ts`.
3. Confirm the exact-selection/UI path offers the multi-group capture correctly.
4. Run the full repository verification suite.
5. Run browser coverage needed to ensure normal desktop and phone play still work.
6. Update `PLAYTEST_BUG_LOG.md` to reflect BUG-004 as fixed in code, pending live itch.io recheck, if verification passes.
7. Do not alter scoring, dealing, CPU difficulty, unrelated rules, desktop visual design, or the guided tutorial implementation.
8. Keep port `8765` untouched.

## Guided tutorial

Planning already exists in `GUIDED_DEMO_MODE_PLAN.md`. Do not implement it in this pass. Preserve it as the next product feature after the sellable build is stable.

## Completion

When verification passes:

1. commit and push to `capture-11-rebuild-v0.1`
2. trigger `.github/workflows/deploy-itch.yml` for the existing `robert-sory/capture-11` HTML5 target
3. wait for the deployment result
4. report the pushed SHA, test result, and itch.io deployment result

Do not create another itch.io project and do not expose credentials.
