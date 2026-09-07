# Capture 11 Next Move

## Current task

Make the current Capture 11 browser build look and behave like a real, low-vision-friendly card game product instead of a compact developer playtest.

If the permanent local Git workflow is not established yet, establish it first using `AGENTS.md`, then continue directly into this task.

## Required visual overhaul

Codex should work in the existing `capture-11-rebuild-v0.1` checkout and make the presentation substantially more readable and product-ready.

### 1. Rebuild the playing-card presentation for low vision

The current cards are too compact and the suits are too hard to distinguish.

Required desktop card treatment:

- materially larger card faces, not tiny compact cards
- large rank in both corners
- large suit identifier that can be recognized without resolving a small pip
- every suit must have multiple independent cues, never color alone:
  - Spades: `S` + `♠` + black/dark treatment
  - Hearts: `H` + `♥` + red treatment
  - Diamonds: `D` + `♦` + blue treatment
  - Clubs: `C` + `♣` + green treatment
- the suit letter and symbol must be large enough to identify at a glance
- preserve the familiar look of a real deck of cards
- numeric pip layouts and face cards must remain recognizable
- cards in the player's hand and on the main board must not be compressed just to fit more items
- prioritize horizontal/vertical scrolling or responsive wrapping over shrinking cards to unreadable sizes

### 2. Fix build-card readability

Builds must not collapse into tiny overlapping cards that make suit/rank recognition impossible.

Required:

- show the actual cards contained in a build at a readable size
- avoid aggressive negative overlap
- show BUILD target prominently
- clearly show OPEN or LOCKED
- clearly show controller/owner
- if a build contains many cards, allow scroll/fan/expand behavior rather than shrinking the cards into illegibility

### 3. Improve overall table presentation

The current UI should stop looking like a compressed debug page.

Required:

- larger, cleaner green felt play area
- more breathing room between CPU area, board, player's hand, score, and controls
- obvious visual hierarchy
- player's hand should be one of the easiest areas to read
- board cards should have enough separation that individual cards can be identified quickly
- controls should not crowd the cards
- keep the dark surrounding UI
- preserve classic Windows card-game simplicity, but make it feel deliberate and finished rather than compact

### 4. Make CPU plays impossible to miss

The user must always know exactly what the CPU played and what happened.

Required:

- CPU card is revealed before resolution
- revealed card is shown at full readable card size
- show full text such as `10 of Diamonds`, not only `10♦`
- hold the revealed play long enough to inspect
- clearly indicate which board cards/build were captured or affected before they disappear
- keep a persistent `LAST CPU PLAY` area after resolution
- last-play area must show both the card and readable text describing the action
- user must not need to process a split-second animation to understand the move

### 5. Do not stop at CSS token changes

This is not complete if Codex only changes a font size, one color, or a few pixels.

The goal is a visibly substantial presentation improvement that the user can notice immediately when the game opens.

## Verification

Codex must launch the actual local browser build and visually inspect it.

Do not report success until all of these are true in the browser:

- card size is obviously larger than the old compact build
- all four suits are immediately distinguishable without relying on tiny pip shapes
- player's hand is comfortably readable
- board cards are comfortably readable
- builds remain readable even when they contain multiple cards
- CPU play is clearly staged and remains reviewable after resolution
- overall game looks like a usable card game, not a compressed developer test page

If the result is still cramped or difficult to distinguish, continue iterating before reporting completion.

## Completion condition

The task is complete only when the user can launch the current branch from the permanent local checkout and immediately see a materially improved card deck, table layout, and CPU-play presentation.

## After completion

Update this file with the next highest-priority issue discovered in the user's real playtest.
