# Capture 11 Next Move

## Visual authority

The approved game-table reference remains:

`docs/ui-reference/capture11-final-ui-goal.jpg`

Keep future game and menu work in this polished dark card-game design family. Do not replace functional DOM/CSS with the reference image as a background.

## Completed

The current `capture-11-rebuild-v0.1` implementation includes:

- a dark three-column game cockpit with dominant teal felt, distinct CPU/table/player zones, side rails, large low-vision cards, readable builds, CPU reveal, and persistent last-play information
- no invalid-selection dead end: a selected hand card can always be played to the table, cleared, or cancelled alongside legal contextual actions
- corrected locked-build rules supporting multiple equal-target groups, including 2 + 7 paired with 9, plus later complete-group additions while a pickup card remains held
- a reference-aligned main menu integrated from `capture11-main-menu-patch-v0.1`
- one-line Capture 11 branding, four real scoring cards, coded-card deck stack, teal presentation table, scoring strip, and responsive desktop/mobile layouts
- functional Play vs CPU, How to Play, Accessibility, Settings, Feedback, and Quit routes
- Play vs CPU opens the current polished game and corrected rules engine

Verified behavior:

- `npm run typecheck` passed
- `npm test` passed: 8 files, 46 tests
- `npm run test:stress` passed: 1 file, 2 tests
- `npm run build` passed
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npm run e2e` passed: 8 desktop/mobile tests
- browser routes, feedback copying, settings persistence, keyboard operation, focus visibility, and accessibility scanning passed
- Chromium comparison passed at default and 150% text scale without horizontal overflow or text collisions
- deterministic Chromium deal 16071 created a locked BUILD 9 from 2 + 7 + 9 while two pickup 9s remained in hand
- launcher remained on Capture 11's assigned port; port 8765 was untouched

## Current task

Extend automated browser coverage for the in-game low-vision presentation and launcher path.

Requirements:

- verify `PLAY-CAPTURE11.sh` leaves a reachable server after the script exits without using or killing port 8765
- verify large suit letter + symbol cues on table and hand cards
- verify readable CPU preview and persistent LAST CPU PLAY states
- add deterministic browser coverage for open and locked build rendering, including grouped locked builds
- keep generated runtime/build/test artifacts out of Git
