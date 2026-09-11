# Capture 11 Playtest Notes

This file records non-bug observations, balance notes, tester reactions, and future design ideas discovered during real playtesting. Bugs belong in `PLAYTEST_BUG_LOG.md`. Do not implement ideas from this file automatically.

## 2026-09-10 — Guided Demo / deterministic scenario harness

- Added six independent scenes loaded by stable identifiers: basic capture, BUG-004 multiple-equal capture, build creation, open-build takeover, multi-group scoring-card strategy, and final capture/sweep/scoring.
- Every demonstration move is validated and applied through the normal engine. Each scene separately verifies its resulting state before enabling Next.
- Replay rebuilds a fresh scenario state; Exit returns to the menu, and browser coverage confirms a subsequent normal match receives a normal four-card hand with no demo markers.
- Final scene uses the normal end-of-hand resolver and `scoreHand`; it produces a 9–4 card count, 5–0 spade count, and 8–1 hand score from the staged captured piles and final sweep.
- Manual itch.io checks remain necessary on Robert's phone and tablet after deployment.
- Deployed game commit `830821a3f74eb584191893ef2d478bff28dc10b1` to the existing `robert-sory/capture-11:html5` target; [workflow 34554632253](https://github.com/shortview231/Casino_Card-game/actions/runs/34554632253) passed and uploaded successfully.

## 2026-09-07 — itch.io external-site playtest

- **Build tested:** `e7718d76a649347e6aee2fb1e577edd1739f7f5d`
- **Environment:** itch.io embedded HTML5 build
- **Tester:** Robert Sory
- **Completed:** two full hands / match playthrough
- **Observed final match score:** You 13, CPU 9
- **Overall verdict:** gameplay felt very good aside from BUG-001 and BUG-002.

### AI difficulty / feel

Robert reports the current CPU difficulty feels substantially better than the earlier concern that the AI might be easy to trick. He had to play deliberately and could not reliably predict the CPU's next move. The match felt strategic rather than like dumping cards against a weak opponent.

The current difficulty should therefore be treated as a useful baseline rather than weakened by default.

### Proposed future difficulty model

This is a design idea for later, not a requested code change yet.

#### Easy

- If the CPU owns or can immediately take a build, it should strongly prioritize taking it on its next turn rather than trying to hold it for a more sophisticated future line.
- More immediate, obvious play.
- Minimal memory and minimal long-term inference.

#### Medium

- May intentionally leave or create builds when there is a reasonable tactical reason.
- Can reason around the current hand and immediate recent context.
- Limited memory of what has already appeared, likely focused on the present deal/hand rather than reconstructing the whole deck.
- Should feel capable but still leave openings for a skilled human to exploit.

#### Hard

- Full-match / full-deck strategic awareness.
- Tracks exposed and captured cards across the hand so it can estimate which ranks and scoring cards remain live.
- Can judge when a build is genuinely safe because relevant pickup cards are already gone.
- Can deliberately defer captures, set traps, protect scoring cards, and plan around likely remaining cards.
- Goal is to behave like an actual experienced Capture 11 strategist rather than merely choosing the best immediate legal move.

### Important playtest insight

Robert specifically noticed situations where he knew he did not need to immediately capture his own build because the cards that could threaten or capture it had already been used. That kind of deck-state reasoning is the clearest conceptual dividing line between a basic CPU and a truly hard CPU.

### Current release implication

Do not retune the existing CPU solely because Robert won. The current build produced a competitive two-hand match and required thoughtful play. Fix the two confirmed rules bugs first, preserve the current AI as a baseline, and use outside testers before deciding whether difficulty adjustment is necessary.

## 2026-09-07 — First true novice external-tester feedback

- **Tester:** close friend, rules not explained beforehand
- **Environment:** live itch.io playtest link
- **Test goal:** determine whether a new player can pick up the game without Robert coaching them
- **Importance:** HIGH — onboarding/usability blocker, not a rules-engine bug

### Verbatim tester feedback

> yeah I just don’t know what to do 🤣 I see I can click my cards and they highlight in yellow and I need 11 but idk how to make a play or anything

### What this proves

The tester successfully reached the actual game, recognized that hand cards are interactive, noticed the yellow selection state, and understood that 11 is important. However, the interface did not teach the next action well enough for a novice to make even the first play without outside explanation.

This is exactly the kind of failure the no-coaching external test was intended to expose. The core game may be mechanically playable, but first-time onboarding is currently insufficient.

### Likely usability gap to investigate

A novice needs the game itself to answer, in context, at least:

1. **What do I click first?** Choose one card from your hand.
2. **What can I do with it?** Capture matching-value board cards, build toward a value you still hold, or play the card loose to the table.
3. **How do I finish the move?** The action area must clearly expose the valid action after the relevant cards are selected.
4. **What does “11” mean?** It is the match-point goal, not the value every individual play must total.

The tester's phrase “I need 11” suggests the current presentation may accidentally imply that each move is supposed to total 11. That misunderstanding should be treated as a particularly important onboarding signal.

### Release implication

Do not interpret this feedback as evidence that the game rules are inherently too complicated. Treat it as evidence that the current first-turn teaching and action affordances are not yet self-explanatory to a novice.

Before a broad public launch, add a focused first-game onboarding pass that teaches one legal move at a time without requiring Robert to explain the rules. Preserve the fast experienced-player flow after onboarding is dismissed/completed. Do not redesign the established polished visual identity solely to solve this.

## 2026-09-07 — Onboarding design decision after novice feedback

Robert approved turning the novice failure into a deliberate teaching system rather than merely adding more written rules.

### Decision

Create two teaching layers:

1. **Contextual first-turn guidance inside normal Play vs CPU** that tells the player what to click next, highlights legal follow-up choices, makes the action that completes the move obvious, and explicitly explains that 11 is the cumulative match score rather than the value each play must make.
2. **A separate Guided Tutorial / Learn to Play mode** with deterministic prepared hands and board states. The tutorial should require the player to perform the real interactions themselves while the game highlights and explains the next step.

### Minimum tutorial lessons

- numeric capture using a simple example such as `4` capturing `A + 3`
- matching face-card capture
- simple build such as playing `3` with board `4` while still holding `7` to create BUILD 7
- later pickup/capture of that build
- scoring explanation and explicit clarification that first to 11 refers to cumulative match points

Locked/fixed builds can be an advanced lesson after the basic tutorial if the full rule is too much for a first-time player.

### Main-menu implication

Keep **Play vs CPU** available immediately, but add **Learn to Play** as a separate menu choice near it. Keep **How to Play** as the written reference rather than replacing it.

### Implementation order

Finish the current BUG-003 mobile usability pass first so the tutorial is built on a phone-playable layout. Then implement the onboarding/tutorial work as the next pre-public-launch UX pass.

Full design and acceptance criteria are recorded in `ONBOARDING_TUTORIAL_PLAN.md`.
