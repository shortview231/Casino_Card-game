# Capture 11 Playtest Notes

This file records non-bug observations, balance notes, tester reactions, and future design ideas discovered during real playtesting. Bugs belong in `PLAYTEST_BUG_LOG.md`. Do not implement ideas from this file automatically.

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
