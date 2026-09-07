# Capture 11 Next Move

## Bootstrap first if needed

If the permanent local clone does not exist, create it now at exactly:

`/home/robertsory/Desktop/Capture 11/Capture11-Dev`

Clone:
`https://github.com/shortview231/Casino_Card-game.git`

Checkout:
`capture-11-rebuild-v0.1`

Do not ask for another path. Do not use ZIP files. Do not create another clone.

Then continue directly into the task below.

## Current task

Make the current Capture 11 browser build look and behave like a real, low-vision-friendly card game product instead of a compact developer playtest.

## Required visual overhaul

Codex should work in the permanent `capture-11-rebuild-v0.1` checkout and make the presentation substantially more readable and product-ready.

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
- prioritize scrolling or responsive wrapping over shrinking cards to unreadable sizes

### 2. Fix build-card readability

- show actual cards contained in a build at a readable size
- avoid aggressive negative overlap
- show BUILD target prominently
- clearly show OPEN or LOCKED
- clearly show controller/owner
- if a build contains many cards, allow scroll/fan/expand behavior rather than shrinking cards into illegibility

### 3. Improve overall table presentation

- larger, cleaner green felt play area
- more breathing room between CPU area, board, player's hand, score, and controls
- obvious visual hierarchy
- player's hand must be one of the easiest areas to read
- board cards need enough separation for quick identification
- controls must not crowd the cards
- keep the dark surrounding UI
- preserve classic Windows card-game simplicity while making it feel deliberate and finished

### 4. Make CPU plays impossible to miss

- CPU card is revealed before resolution
- revealed card shown at full readable card size
- show full text such as `10 of Diamonds`
- hold revealed play long enough to inspect
- clearly indicate which board cards/build were captured or affected before they disappear
- keep a persistent `LAST CPU PLAY` area after resolution
- last-play area shows both the card and readable action text
- user must never need to process a split-second animation to understand the move

### 5. Do not stop at tiny CSS tweaks

Changing one font size, one color, or a few pixels does not complete this task.

The result must be a visibly substantial presentation improvement immediately noticeable when the game opens.

## Verification

Launch the actual local browser build and inspect it.

Do not report success until all are true:

- card size is obviously larger than the old compact build
- all four suits are immediately distinguishable without relying on tiny pip shapes
- player's hand is comfortably readable
- board cards are comfortably readable
- builds remain readable with multiple cards
- CPU play is clearly staged and reviewable after resolution
- overall game looks like a usable card game, not a compressed developer test page

If it still looks cramped or difficult to distinguish, continue iterating before reporting completion.

## Completion condition

Complete only when the permanent local checkout launches a materially improved card deck, table layout, and CPU-play presentation.

## After completion

Update this file with the next highest-priority issue discovered in the user's real playtest.
