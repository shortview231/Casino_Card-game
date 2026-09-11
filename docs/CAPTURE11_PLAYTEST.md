# Capture 11 v0.1 Human vs CPU Playtest

Branch: `capture-11-rebuild-v0.1`

This is the first full browser playtest of the family Capture 11 rules on the reusable Microgame Engine. It is intentionally a rules-first build, not final commercial art/polish.

## Pull and run

If the repository already exists on the PC:

```bash
git fetch origin
git switch capture-11-rebuild-v0.1
git pull
npm install
npm run dev -- --host 127.0.0.1
```

Open the local Vite address shown in the terminal, normally `http://127.0.0.1:5173`.

For a fresh clone:

```bash
git clone https://github.com/shortview231/Casino_Card-game.git
cd Casino_Card-game
git switch capture-11-rebuild-v0.1
npm install
npm run dev -- --host 127.0.0.1
```

## Implemented in this build

- Human vs CPU match
- standard 52-card deck
- reusable coded playing-card faces and card backs
- visual build renderer that shows the real cards contained in each build
- open vs locked build presentation and current build controller
- four cards to each player and four opening board cards
- later four-card redeals with no new board cards
- alternating dealer
- nondealer acts first
- Ace = 1 for build arithmetic
- 2 through 10 use printed numeric value
- J/Q/K are not treated as numeric tens
- matching face-card capture
- loose numeric combination capture
- open builds
- must still hold the declared target card after building
- raising/burning an open build when the new target is still held
- paired/fixed builds that cannot be raised
- collision-safe unique IDs for builds throughout the hand
- build capture by matching target
- last capturer receives every remaining board/build card at hand end
- hand scoring: Aces 1 each, 2♠ 1, most spades 1, most cards 2, 10♦ 3
- tied most-cards or most-spades category awards nobody
- match continues hand to hand until a player finishes above the opponent at 11+ points
- end-of-hand score breakdown
- keyboard/touch/mouse-compatible controls
- text scale, high contrast and reduced-motion support inherited from Microgame Engine
- reproducible playtest seed and move/state log
- automatic 52-card conservation check after every recorded move

## Playtest diagnostics

Open the **Playtest** disclosure near the bottom of the game at any time.

It shows:

- the original match seed;
- the current hand seed and hand number;
- `52 cards OK` when every card exists exactly once across the deck, both hands, board/builds and captured piles;
- a complete JSON playtest log containing the seed, every human/CPU move and the resulting state.

Use **Copy playtest log** when reporting a problem. If clipboard access is unavailable, select the JSON from the visible log box and copy it manually.

The match seed lets the same initial shuffle be reproduced. The recorded move sequence makes it possible to turn a gameplay bug into an automated regression test instead of relying on memory.

## Highest-value human tests

1. Try `A + 4 -> build 5` while keeping another 5 in hand.
2. Let the CPU/player raise an open 5 with a 3 while still holding an 8. Confirm the build becomes 8 and changes control.
3. Create a same-value paired build, such as playing a 5 onto a board 5 while another 5 remains in hand. Confirm it is shown as locked.
4. Grow a large build. Confirm every physical card remains visible in the build renderer and the card count is correct.
5. Capture a large build and verify every physical card in it moves into the captured-card count.
6. Leave several cards on the final board. Confirm the player who made the final capture receives all of them before scoring.
7. Watch for a 26–26 captured-card split. Confirm the Most Cards category awards 0 to both players.
8. Play through multiple hands and confirm dealer rotates and the nondealer always acts first.
9. Try to make a build without keeping the declared target in hand. The game should refuse to offer that move.
10. Keep an eye on the Playtest summary. `52 cards OK` should remain true throughout normal play.
11. Check any family-rule edge case where the UI refuses a move that should be legal. Copy the playtest log and note what you intended to do.

## Known playtest boundary

The engine is conservative where the family rules have not yet been fully specified. In particular, this build treats one played card as capturing one selected loose-card combination OR one build, not several independent groups/builds simultaneously. If the family game permits broader compound captures, that rule should be confirmed from real play and then added to the authoritative rules contract and tests.

Private online PvP is intentionally not part of this v0.1 playtest. It will reuse this same authoritative move/state engine after Human vs CPU rules are verified.
