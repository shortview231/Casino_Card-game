# Capture 11 Onboarding and Guided Tutorial Plan

## Why this exists

The first novice external tester reached gameplay, discovered that hand cards are clickable, saw the yellow selection state, and understood that 11 matters, but could not determine how to make a legal play without Robert explaining the game.

The goal is not to simplify Capture 11's rules. The goal is to teach the interaction loop clearly enough that a new player can complete the first few moves without outside coaching.

## Product decision

Add two complementary teaching layers:

1. **Immediate in-game guidance for every new player** so the first turn explains what to do next.
2. **A deterministic Guided Tutorial mode** that deliberately teaches Capture, Build, face-card capture, build pickup, and scoring with prepared hands/boards.

Experienced players must still be able to start a normal CPU match immediately without tutorial friction.

---

## Layer 1: first-turn contextual guidance

Normal Play vs CPU should remain the real game. Add a lightweight helper that is visible during the first turn and can be dismissed.

### First-turn copy

Use short action-oriented instructions, not a wall of rules.

Initial state:

**YOUR TURN**

**1. Pick a card from your hand.**

After a hand card is selected:

**2. Select cards on the table that your card can take, or choose an available build.**

When a legal action is available:

**3. Choose the highlighted action to finish your move.**

Always make this distinction visible somewhere in the helper:

**11 is the match score to win. Your individual plays do not need to add to 11.**

### Interaction requirements

- Keep the existing yellow selected-card state.
- When a player selects a hand card, visually emphasize legal next choices on the board and/or action panel.
- Do not make illegal cards disappear. They may remain visible but should not look like valid next targets.
- When only one obvious action is available, make that action visually dominant.
- If the player selects an invalid combination, explain why in plain language and preserve a way to recover without resetting the turn.
- Include a **Show me** or **Hint** control that points to one legal next step without automatically playing the move.
- Include a **Hide tips** control so experienced players can remove the helper immediately.

### Do not

- Do not force a modal before every turn.
- Do not shrink the game to make room for instruction text.
- Do not require reading the full How to Play page before playing.
- Do not imply that every capture/build totals 11.

---

## Layer 2: Guided Tutorial mode

Add a clear main-menu entry such as:

**Learn to Play**

or

**Guided Tutorial**

This should be separate from **How to Play**. How to Play remains the written reference. Guided Tutorial is interactive and deterministic.

### Tutorial principle

Each lesson should place a specific hand and board state, highlight the relevant cards, and require the player to perform the move themselves.

The tutorial should not merely animate the answer. The player must tap/click the correct cards and action so they learn the same controls used in a real match.

If the player chooses something else, the tutorial should gently explain the goal and keep the state intact.

### Lesson 1: make a basic numeric capture

Prepared example:

- Player hand includes a `4`.
- Board includes `A + 3` plus unrelated cards.

Teach:

1. Select the `4` in your hand.
2. Select the `A` and `3` on the board.
3. Explain `A = 1`, so `1 + 3 = 4`.
4. Press the highlighted **Capture** action.
5. Show the captured cards moving to the player pile.

Teaching message:

**Your played card captures loose numeric cards that add up to its value.**

Also show:

**You are trying to reach 11 match points. This move does not need to total 11.**

### Lesson 2: capture a face card

Prepared example:

- Player holds a Queen.
- Board contains a Queen plus unrelated cards.

Teach that face cards keep their rank identity and capture the matching face card.

### Lesson 3: make an open build

Prepared example:

- Player hand contains `3` and `7`.
- Board contains a loose `4`.

Teach:

1. Select/play the `3`.
2. Select the board `4`.
3. Because the player still holds a `7`, `3 + 4` may become **BUILD 7**.
4. Choose **Build 7**.

Teaching message:

**You may only build to a value you still hold in your hand.**

### Lesson 4: capture your build

Give the player the pickup `7` on a later prepared turn and let them capture BUILD 7.

Teach that leaving a build on the board creates risk because the opponent may interact with it under the normal rules.

### Lesson 5: locked/fixed build concept

Optional advanced tutorial lesson after the basics.

Prepared example should demonstrate two groups that each equal the same target, such as a loose `7` plus `3 + 4 = 7`, while the player still holds the pickup `7`.

Explain that this becomes a locked/fixed BUILD 7 and cannot be raised.

Do not make this part of the minimum first-time tutorial if it creates too much cognitive load. It can be an **Advanced Builds** lesson.

### Lesson 6: scoring and the goal of 11

Show a short scoring summary using actual captured-card examples:

- each Ace = 1
- `2♠` = 1
- Most Spades = 1
- `10♦` = 3
- Most Cards = 2

Then explicitly state:

**These points are added after a hand. First player to 11 cumulative match points wins.**

This lesson exists specifically to prevent the novice misunderstanding that every play must make 11.

---

## Main-menu changes

Current menu has:

- Play vs CPU
- How to Play
- Accessibility
- Settings
- Feedback
- Quit

Proposed order:

1. **Play vs CPU**
2. **Learn to Play**
3. **How to Play**
4. Accessibility
5. Settings
6. Feedback
7. Quit

Do not replace How to Play. The two serve different purposes:

- **Learn to Play** = interactive practice
- **How to Play** = reference/rules lookup

A small first-time callout may say:

**New to Capture 11? Try Learn to Play first.**

Do not block Play vs CPU behind the tutorial.

---

## Mobile requirement

The tutorial must use the same responsive/mobile interaction system as the real game. It cannot be a desktop-only overlay.

At phone sizes:

- tutorial instructions must appear immediately before or adjacent to the relevant gameplay area
- highlighted cards and action controls must remain reachable by normal touch scrolling
- no horizontal page overflow
- hint text must not cover the board or hand

The current BUG-003 mobile pass should land first so the tutorial is built on the corrected mobile layout rather than compensating for a broken viewport.

---

## Accessibility requirements

- Tutorial state cannot rely on color alone. Pair highlight color with labels, outlines, arrows/icons, or text such as **SELECT THIS CARD**.
- Every tutorial instruction should be announced appropriately for screen-reader users without repeatedly re-announcing the entire game surface.
- Preserve keyboard navigation and visible focus.
- Support 150% text scaling.
- Avoid time limits.
- Provide Previous/Repeat/Hint where useful, but keep the main flow simple.

---

## Testing acceptance criteria

The onboarding work is not considered successful only because automated tests pass.

Required external success condition:

A novice who has never played Capture 11 should be able to:

1. open the game without coaching
2. identify **Learn to Play**
3. complete a basic numeric capture
4. complete a basic build
5. understand how to finish a turn
6. correctly explain that 11 is the cumulative match-point goal, not the required total of each play
7. start a normal CPU match and make at least one legal move without Robert explaining the controls

Add deterministic browser tests for each tutorial lesson and for dismissing/hiding contextual tips.

---

## Release priority

This is a **pre-public-launch onboarding requirement** based on real novice feedback.

Order of operations:

1. finish BUG-003 mobile usability pass
2. implement contextual first-turn guidance
3. implement Guided Tutorial basics (numeric capture, face capture, simple build, build pickup, scoring)
4. test with a novice who has not been coached
5. add advanced locked-build teaching only if needed before launch

Do not change CPU difficulty or unrelated family rules as part of this onboarding work.
