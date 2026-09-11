# Capture 11 Family Rules Contract v0.1

This document is the source-of-truth rules contract for the Capture 11 rebuild. It supersedes conflicting assumptions in the older Casino-era implementation.

## Match

- Two players.
- First player to reach 11 match points wins.
- A match contains multiple hands.
- Dealer alternates every hand.
- The non-dealer acts first.

## Deal

- Standard 52-card deck.
- Deal four cards to each player and four loose cards to the board at the opening of a hand.
- After both hands are exhausted, continue dealing four cards to each player until the deck is exhausted. Do not add four new board cards on later deals.

## Card roles

- Ace has numeric build value 1.
- Cards 2 through 10 use their printed numeric value for arithmetic builds.
- Jacks, Queens, and Kings are not treated as numeric 10s in the rebuild.
- Face cards retain rank identity and can participate in matching-rank pickups. Example confirmed by play history: holding a Queen can be preserved to capture a Queen left on the board late in the hand.

## Turn actions

A player plays one card from hand and uses it to make a legal Capture 11 action such as:

- discard a loose card to the board;
- capture legal loose card(s), matching face rank, or build(s);
- create a numeric build;
- legally raise an open numeric build;
- create/use a paired build whose declared value is fixed.

The exact move validator will encode each legal combination as tests before the UI depends on it.

## Numeric builds

- Loose numeric cards may be combined by addition to make a declared target from 1 through 10.
- A player declaring/building a target must hold the required matching target card in hand according to the family rule. The software will enforce this instead of relying on honor-system play.
- Example: A + 4 may form a build of 5 when the player legally satisfies the held-card requirement.
- An opponent may raise an open build by adding legal value when they can satisfy the newly declared target. Example: an open 5 build plus 3 may become 8.
- This creates the core burn/steal risk: a player may invest valuable cards in a build and lose the entire build when the opponent legally changes or captures it.

## Paired/fixed builds

Confirmed family-rule behavior: a same-value paired build can establish a fixed declared value that cannot then be raised like an open arithmetic build.

Example discussed during rules capture: with two 5s in hand and a 5 on the board, a player can use the relevant 5 play to declare/build 5 while retaining the required matching card. That fixed build is not treated like an open A + 4 = 5 build for later raising.

This area requires exhaustive scenario tests before release because wording is easy to misunderstand even though experienced play is intuitive.

## Captures and board strategy

- Captured cards are kept in the capturing player's pile for hand scoring.
- Players may intentionally leave capturable cards on the board. The game must not force an available capture or warn away legal risky play.
- Face-rank pairs are strategically useful for late pickups because players may preserve a matching J/Q/K while leaving its mate on the board.
- Card memory, baiting, risking point cards inside builds, and fighting over the final pickup are intentional strategy.

## Final-board sweep

- When the deck and both hands are exhausted, cards may remain on the board.
- The player who made the most recent capture/pickup receives every card remaining on the final board.
- Remaining loose cards and every card contained in remaining builds are included in that sweep.
- The software must track `lastCapturer` throughout the hand.

Unresolved edge case: if a hand somehow ends with no capture ever recorded, the family rule for the remaining board has not yet been specified. The engine must not invent an answer.

## Hand scoring

After the final-board sweep, captured cards score:

- each Ace: 1 point, 4 total available;
- 2 of Spades: 1 point;
- most Spades: 1 point;
- most cards: 2 points;
- 10 of Diamonds: 3 points.

The standard scoring categories therefore represent 11 possible points.

### Ties

- If captured cards split 26-26, the 2-point most-cards category is null. Neither player receives those points.
- Any tied majority category should award no majority point unless a later family-rule clarification says otherwise.

## Product behavior

- Human vs CPU is the first playable implementation.
- Private human vs human is a required product milestone after rules validation.
- CPU and online players must use the same authoritative move validator and state machine.
- The game should preserve legal mistakes, risk, burns, stealing, large builds, last-pickup planning, and revenge play rather than protecting players from strategic errors.

## Still to formalize with scenario tests

1. Exact legal selection rules when one played numeric card can capture multiple loose combinations.
2. Exact behavior for simultaneous loose-card and build captures with the same played card.
3. Complete paired/fixed-build construction and capture cases.
4. Whether and how multiple independent builds with the same target may coexist or combine.
5. Match outcome if both players cross 11 after scoring the same hand.
6. No-capture-ever final-board edge case.

These are intentionally explicit instead of guessed. Every resolved rule should become an automated test before release.
