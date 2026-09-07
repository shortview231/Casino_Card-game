# Capture 11 Next Move

## Visual authority

The approved game-table reference remains:

`docs/ui-reference/capture11-final-ui-goal.jpg`

Keep the current polished dark card-game presentation. Do not redesign the UI in this task.

## Current task: fix the two confirmed playtest rule bugs, verify them, push, and redeploy itch.io

Read `PLAYTEST_BUG_LOG.md` first. Treat Robert's family-rule descriptions there as authoritative.

### BUG-001 — paired/fixed build rejects matching target card

Fix the legal-move/build logic so a fixed/paired build can contain multiple groups that each equal the same target, including a loose board card already equal to the target.

Required regression scenario:

- player still holds the pickup `7`
- selected/played build card plus board arithmetic group creates `3 + 4 = 7`
- a separate loose board `7` is also selected
- result is one locked/fixed BUILD 7 containing both equal-value groups
- the build is not raisable

Also cover at least one additional target value so the fix is value-independent.

### BUG-002 — simultaneous locked-build + loose-value capture rejected

Fix capture selection so one played numeric card can capture an already-existing matching build and one or more selected loose-card groups that independently equal the same played value in the same play.

Required regression scenario:

- player plays `10`
- board contains an existing locked BUILD 10
- board also contains loose `9 + A = 10`
- selecting the BUILD 10 plus `9 + A` is a legal single capture and takes all selected cards

Also cover another target value such as BUILD 7 plus loose `3 + 4` captured by a 7.

### Guardrails

- Do not alter unrelated Capture 11 family rules.
- Do not change CPU difficulty or AI strategy in this task.
- Do not redesign the main menu or game table.
- Preserve the current accessibility behavior, responsive layout, CPU reveal timing, scoring, and diagnostics.
- Keep port 8765 untouched.
- Add focused regression tests for both bugs before considering them fixed.
- Run the full existing verification suite after the fixes.

### Bug journal update

After the regression tests pass, update `PLAYTEST_BUG_LOG.md`:

- BUG-001 -> `FIXED IN CODE — PENDING ITCH.IO RECHECK`
- BUG-002 -> `FIXED IN CODE — PENDING ITCH.IO RECHECK`
- briefly record the regression coverage added

Do not mark either bug fully VERIFIED until Robert confirms the behavior in the deployed itch.io build.

## Required verification

Run at minimum:

- `npm run typecheck`
- `npm test`
- `npm run test:stress`
- `npm run build`
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npm run e2e` when that executable is available; otherwise use the project's normal Playwright Chromium path

Verify in a real browser that normal Capture 11 play still loads from the main menu and that the two corrected selection patterns are accepted.

## Commit and push

When all verification passes:

1. commit the fixes, tests, and bug-log status updates
2. push to `capture-11-rebuild-v0.1`
3. report the exact pushed commit SHA

## itch.io redeploy in the same Codex run

After the push succeeds, Codex is authorized to trigger the existing GitHub Actions workflow that deploys the verified build to itch.io.

Use the existing workflow:

`.github/workflows/deploy-itch.yml`

Target parameters:

- ref/branch: `capture-11-rebuild-v0.1`
- `itch_target`: `robert-sory/capture-11`
- `channel`: `html5`
- `confirm`: `DEPLOY`

If GitHub CLI is authenticated with Actions permission, use the equivalent of:

`gh workflow run deploy-itch.yml --ref capture-11-rebuild-v0.1 -f itch_target=robert-sory/capture-11 -f channel=html5 -f confirm=DEPLOY`

Then watch/check that workflow run until it completes and report the run URL and final result. The deploy workflow itself reruns core verification, browser/accessibility verification, builds the project, and pushes `dist` through butler.

If Codex cannot trigger the workflow because the local GitHub authentication lacks Actions/workflow permission, do not invent success and do not change credentials. Stop after the successful push and report the exact single GitHub UI action Robert must take.

Do not create a new itch.io project, do not change the itch target, and do not expose `BUTLER_API_KEY`.