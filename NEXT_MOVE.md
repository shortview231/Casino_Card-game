# Capture 11 Next Move

## Completed

The low-vision browser presentation overhaul is complete in the permanent checkout:

`/home/robertsory/Desktop/Capture 11/Capture11-Dev`

Completed on branch:

`capture-11-rebuild-v0.1`

Verified improvements:

- larger, readable playing cards in the player's hand and on the board
- suit letter + symbol + distinct color cues for S/Spades, H/Hearts, D/Diamonds, and C/Clubs
- wider green felt table with more space between CPU hand, board, player hand, controls, rules, and diagnostics
- readable build cards with prominent BUILD target, OPEN/LOCKED state, owner, and non-overlapped contained cards
- CPU play preview with a full readable card and full card-name action text before resolution
- persistent LAST CPU PLAY panel after resolution
- dark surrounding UI restored around the game surface

Launcher follow-up also completed:

- `PLAY-CAPTURE11.sh` now detaches the local Python server with `setsid` when available, falling back to `nohup`
- the printed launcher URL remains reachable after the script exits in Codex/noninteractive execution
- `.capture11-server.pid` and `.capture11-server.port` identify the live Capture 11 server
- port `8765` remains untouched

Validation run:

- `bash ./UPDATE-CAPTURE11.sh` passed before implementation
- `npm run typecheck` passed after implementation
- `npm test` passed after implementation: 8 files, 41 tests
- `npm run build` passed after implementation
- `bash ./PLAY-CAPTURE11.sh` passed after implementation
- `curl -I` against the printed URL returned `200 OK`
- actual Chromium browser screenshots verified launcher page, game table, build, CPU preview, and last-play states

## Current task

Add automated browser coverage for the Capture 11 low-vision presentation and launcher path so future changes do not regress the completed playtest work.

Requirements:

- keep the existing port policy: never use or kill port `8765`
- verify `PLAY-CAPTURE11.sh` leaves a reachable server after the script exits
- verify the game table renders larger low-vision cards with visible suit letter + symbol cues
- verify a CPU preview panel appears with a readable played card and full card-name text
- verify a persistent LAST CPU PLAY panel remains after resolution
- include a build-state check if it can be made deterministic without brittle random clicking
- do not require ZIP files or duplicate checkouts

Acceptance:

- automated checks run from the repository root
- checks pass locally on the permanent Linux checkout
- any required browser dependency/setup limitation is documented in the test or README
