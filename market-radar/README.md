# Microgame Market Trend Radar

Status: ACTIVE MARKET-INTELLIGENCE LAYER / NOT A BUILD OR RELEASE GATE BY ITSELF

## Purpose
Track changing public marketplace evidence so Microgame Engine product decisions are informed by persistent trends instead of one-off browsing.

## Current public sources
- itch.io Top Sellers: https://itch.io/games/top-sellers
- itch.io New & Popular: https://itch.io/games/new-and-popular
- itch.io Most Recent: https://itch.io/games/newest
- itch.io Top Rated: https://itch.io/games/top-rated
- Newgrounds Popular: https://www.newgrounds.com/games/popular
- Newgrounds Latest/Browse: https://www.newgrounds.com/games/browse

## Cohorts
### Top Cohort
Capture the first 25 publicly ranked games from important marketplace lists. Preserve rank, title, creator, displayed price, public genre/category, browser-play signal, public hook/description, and source URL.

### Latest Seed Cohort
Capture 25 newly listed games. These are NOT called failures. Recheck the same titles after 7, 30 and 60 days. Record whether they surface in New & Popular / Top Sellers / Top Rated, whether public ratings/engagement become visible, and whether the project remains available.

### Basement Cohort
Only assign after sufficient aging evidence. A title may enter the basement comparison when it repeatedly fails to gain public discovery/engagement relative to comparable same-age releases. Do not claim exact low sales/downloads unless the marketplace actually publishes those numbers.

## Required longitudinal fields
- captured_at
- source/cohort
- rank
- title
- creator
- displayed price/currency text
- genre/category
- browser-play signal
- hook/description
- 7/14/30/60 day presence and rank
- first_seen / last_seen
- days_in_top_25
- peak_rank
- trend direction
- visible rating/count/views when public
- notes on presentation, onboarding and IP risk

## Weekly derived report
- current Top 25
- new entries
- rank climbers/fallers
- persistent leaders
- genre/mechanic/tag movement
- price distribution
- browser-vs-download signal
- winner traits
- aged low-traction traits
- IP/legal warnings
- BUILD TOWARD / AVOID / WATCH hypotheses

## Evidence rules
1. A public ranking is evidence of marketplace visibility, not proof of exact sales unless the platform says so.
2. Missing price is recorded as `not displayed`, not automatically `free`.
3. `Play in browser` is recorded only when the public source explicitly shows it.
4. Fan games/remakes can teach market lessons but do not grant Product Engine permission to use protected characters, brands, art, names, music or code.
5. Do not download or reuse third-party assets unless a separate asset-license review explicitly permits commercial reuse.
6. Market trends inform research priority. They do not override originality, product quality, accessibility, QA or human release gates.

## Snapshot naming
`market-radar/snapshots/YYYY-MM-DDTHHMM-offset.json`

Snapshot 001 was captured 2026-08-29 and establishes the first historical baseline.
