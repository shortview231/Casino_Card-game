# Capture 11 Main Menu Patch

This branch is intentionally a patch branch for Codex to inspect and adapt into the permanent local checkout.

## Patch branch

`capture11-main-menu-patch-v0.1`

## Important integration rule

Do **not** reset, replace, or discard the current polished Capture 11 game-table work in the user's local checkout.

The user's local `capture-11-rebuild-v0.1` may contain newer presentation work than the remote base used to construct this patch. Treat this branch as a focused menu implementation to compare and integrate, not as permission to overwrite local game UI files.

## Visual target

The authoritative visual target is the Capture 11 main-menu render attached in the user's Codex prompt.

Key composition:

- dark navy/black framed shell matching the finished game
- large `CAPTURE 11` branding on the left
- tagline: `BUILD. STEAL. BURN. CAPTURE. FIRST TO 11.`
- large left-side menu buttons
- teal felt presentation area
- exactly four hero cards, following real Capture 11 rules/scoring:
  - 10♦
  - 2♠
  - A♥
  - A♣
- scoring strip showing Aces, 2♠, 10♦, Most Spades, Most Cards
- no fake five-card hand
- no background-image shortcut; use functional DOM/CSS and the real coded-card renderer

## Files in this patch

- `src/games/capture11/mainMenu.ts`
- `src/games/capture11/mainMenu.css`
- `src/engine/contracts.ts`
- `src/engine/runtime.ts`
- `src/main.ts`

## Intended behavior

### Play vs CPU
Starts a real Human vs CPU Capture 11 match through the existing runtime.

### How to Play
Opens an in-app rule screen using the actual Capture 11 rules and has working Play and Back controls.

### Accessibility
Opens an in-app accessibility explanation with S/H/D/C + symbol cues and a working button into runtime Settings.

### Settings
Uses the existing runtime settings for text size, high contrast, reduced motion, and sound.

### Feedback
Opens a playtest-feedback screen and lets the tester copy a concise feedback template. It also explains how to copy the in-game playtest log for reproducible rule bugs.

### Quit
Because this is a browser build, it opens a clear exit screen telling the tester they can close the tab and provides a working Return to Main Menu button. Do not pretend a normal webpage can forcibly close a user-opened browser tab.

## Codex task

1. Fetch this patch branch.
2. Compare it against the current local `capture-11-rebuild-v0.1` worktree.
3. Preserve the user's current polished game/table implementation.
4. Integrate or adapt the menu/runtime-hook changes into that current local branch.
5. Use the render attached in the prompt as the visual authority, not this document alone.
6. Run typecheck, unit tests, build, and browser verification.
7. Click every menu button and verify it reaches the intended screen/action and can return correctly.
8. Verify Play vs CPU reaches the current polished game, not an older layout.
9. Verify keyboard focus is obvious and the menu remains usable at large text/zoom.
10. Only after browser verification, commit and push the integrated result to `capture-11-rebuild-v0.1`.
