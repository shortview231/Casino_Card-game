# Capture 11 Next Move

## Source of truth

Repository: `shortview231/Casino_Card-game`
Branch: `capture-11-rebuild-v0.1`

Read `AGENTS.md`, `PLAYTEST_BUG_LOG.md`, and `GUIDED_DEMO_MODE_PLAN.md` before editing.

## Current priority: make tonight's build sellable

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
