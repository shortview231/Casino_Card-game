# Capture 11 Guided Demo Mode Plan

## Goal

Create an interactive, deterministic teaching match that uses the real Capture 11 controls and rules engine. The player learns by making guaranteed example plays instead of reading a long rule page.

This is not a separate simplified ruleset. The demo should construct known game states, constrain or highlight the intended next action, explain why it works, then advance to the next prepared state.

## Entry flow

Keep the main menu simple.

When the player chooses **Play Capture 11**, show a small choice panel:

- **Play Game**
- **Tutorial / Guided Demo**
- **Back**

Suggested copy:

**New to Capture 11? The guided demo teaches the game by letting you make the moves yourself.**

Experienced players can choose Play Game immediately. Do not force the tutorial.

## Tutorial design rule

The tutorial must use guaranteed hands and board states. Do not rely on random seeds alone for lesson-critical cards.

Each lesson should define:

- exact player hand
- exact CPU hand when needed
- exact board
- exact deck / remaining-deck state when needed
- whose turn it is
- allowed or highlighted lesson objective
- success condition
- short explanation before and after the move

The real game engine should validate and execute the move wherever possible. Tutorial code should prepare state and guide the player, not duplicate Capture 11 rules.

## Lesson sequence

### Lesson 0: What you are looking at

Prepared opening-style state:

- 4 cards in your hand
- 4 cards in the CPU hand, face down
- 4 loose cards on the table
- remaining deck displayed
- CPU is dealer so the player moves first

Teach only the essentials:

- Capture 11 is two players.
- Each player receives 4 cards.
- 4 cards begin face up on the table.
- The remaining cards stay in the deck.
- When both players use those 4 cards, another 4 are dealt to each player until the deck is exhausted.
- The nondealer plays first.

Do not explain every scoring rule here.

### Lesson 1: Basic numeric capture

Prepared state:

- player holds a `4`
- board contains loose `2`, loose `2`, plus unrelated cards

First teach the arithmetic interpretation:

1. Select the `4`.
2. Select both board `2`s.
3. Show `2 + 2 = 4`.
4. Choose **Capture 2 board cards**.

Message:

**Numeric cards can capture loose cards whose values add up to the card you play.**

This state should be reused immediately to explain the second legal interpretation:

**If you played a 2 instead, those two loose 2s are also two separate matching groups. A played 2 may capture both matching 2s in one move.**

This directly teaches the BUG-004 multi-group rule instead of leaving it as an obscure edge case.

### Lesson 2: A mixed arithmetic capture

Prepared state:

- player holds a `7`
- board contains `2 + 4 + A`

Teach:

- Ace is numeric 1.
- `2 + 4 + A = 7`.
- A played 7 can capture all three loose cards.

This establishes the arithmetic model before introducing builds.

### Lesson 3: Create a BUILD 7

Prepared state:

- player hand includes `2` and a separate `7`
- board includes loose `4` and `A`

Teach:

1. Select/play `2`.
2. Select board `4` and `A`.
3. `2 + 4 + A = 7`.
4. Because another `7` remains in the player's hand, the player may choose **Build 7** instead of capturing.

Core message:

**You may only build to a number you still hold in your hand.**

The board should visibly replace the selected cards with BUILD 7.

### Lesson 4: Builds are risky because the opponent can take them

Use a scripted CPU response after the player creates BUILD 7.

Preferred first demonstration:

- CPU is guaranteed to hold a `7`.
- CPU plays the `7` and captures the player's BUILD 7.

Message:

**A build is not protected because you created it. If the opponent can legally capture it, they can take it.**

This creates the emotional lesson immediately: building is powerful but risky.

Later or as an advanced lesson, demonstrate a burn/raise:

- open BUILD 5 exists
- CPU holds 8 and plays 3
- CPU raises BUILD 5 to BUILD 8

Message:

**An open build can sometimes be raised to a new value when the player making the raise still holds that new pickup card.**

### Lesson 5: Capture your own build

Use a separate prepared state so the tutorial does not depend on the scripted steal above.

- player holds `7`
- BUILD 7 is already on the board

Have the player select the 7 and the build, then capture it.

Message:

**If your build survives until your turn and you still have the matching pickup card, you can capture the entire build.**

### Lesson 6: Multiple groups in one capture

Prepared state:

- player holds `8`
- board contains loose `8`, loose `3`, loose `5`

Teach that these are two independent groups worth 8:

- group 1: `8`
- group 2: `3 + 5`

The played `8` captures all three board cards in one move.

This generalizes the two-loose-8 fix into the actual family rule instead of teaching only one special case.

### Lesson 7: Locked / paired build

Advanced lesson.

Prepared state:

- player still holds pickup `7`
- played card plus selected loose cards create one 7 group
- another loose 7 already exists

Example:

- play `3`
- select loose `4`
- select loose `7`
- retain another `7` in hand

Teach that the board contains two complete 7 groups:

- `3 + 4 = 7`
- `7 = 7`

They combine into a locked BUILD 7.

Message:

**A locked build contains multiple complete groups of the same value and cannot be raised like an open build.**

### Lesson 8: What happens when the deck runs out

Use a deliberately short end-of-hand state rather than playing through 52 cards.

Prepared state:

- deck is empty
- both players are on their final cards
- several unrelated loose cards remain on the board
- player performs the final capture of the hand

After the final cards are played, show the engine moving every remaining board card to the most recent capturer.

Message:

**When the deck and both hands are empty, the player who made the most recent capture takes every card still left on the table.**

Visually show the leftover cards joining that player's captured pile. This rule should be demonstrated, not only stated in text.

Do not invent behavior for the unresolved no-capture-ever edge case in the tutorial.

### Lesson 9: Scoring and first to 11

End with a prepared scoring screen using visible examples.

Teach:

- each Ace = 1 point
- 2 of Spades = 1 point
- Most Spades = 1 point
- 10 of Diamonds = 3 points
- Most Cards = 2 points

Critical message:

**11 is the cumulative match score needed to win. Your individual captures and builds do not need to total 11.**

## Tutorial interaction behavior

For every lesson:

- Highlight the card the player should start with, but do not play it automatically.
- After the hand card is selected, highlight the valid board targets for that lesson.
- Keep unrelated cards visible so the player learns the real table layout.
- If the player selects the wrong card, explain the objective and let them retry without restarting the whole tutorial.
- The correct action button should become visually prominent once the selection is legal.
- Include **Hint**, **Repeat explanation**, and **Exit Tutorial**.
- Do not use timers.
- Tutorial highlights must use text/outline/icon cues in addition to color.

## Engineering approach

Prefer a tutorial controller layered over the existing game rather than a second game implementation.

Suggested pieces:

1. `TutorialScenario`
   - id
   - title
   - prepared `Capture11State`
   - instructional text
   - expected move predicate or exact expected move
   - success text
   - next scenario id

2. `createTutorialState(scenarioId)`
   - constructs the exact hand, board, deck, dealer, turn, captures, and scores needed for the lesson

3. Tutorial UI/controller
   - renders the normal Capture 11 board
   - adds lesson instructions and accessible highlights
   - intercepts completed legal moves only to determine whether the lesson objective was satisfied
   - advances to the next deterministic state when successful

4. Scripted CPU tutorial moves
   - used only when a lesson needs the opponent to demonstrate stealing or raising a build
   - should still call the real `applyMove` engine path

Do not teach by mutating the production rules engine. The tutorial should be a consumer of those rules.

## Testing

Add deterministic unit/browser coverage for at least:

- 4 captures 2 + 2
- 2 captures two independent loose 2s
- 7 captures 2 + 4 + A
- 2 + 4 + A creates BUILD 7 while a 7 remains in hand
- scripted CPU captures a player's BUILD 7
- player captures BUILD 7
- 8 captures loose 8 plus loose 3 + 5 in one play
- locked BUILD 7 example
- end-of-hand final-board sweep goes to the most recent capturer
- tutorial can exit to menu and normal Play Game remains unaffected

## Release goal

A first-time player should be able to complete the guided demo and then answer these questions correctly without Robert coaching them:

1. How many cards does each player get at a time?
2. What are the four cards on the table for?
3. How does a numeric capture work?
4. What is a build and why can the opponent take it?
5. Why must you retain the target card when making a build?
6. What happens to leftover table cards after the deck and hands are exhausted?
7. What does 'first to 11' actually mean?
