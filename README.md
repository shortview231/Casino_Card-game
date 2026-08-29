# Product Engine Microgame Engine

A reusable foundation for manufacturing small, original, low-cost games quickly.

> Build the shell once. Ship many tiny games through it.

## Repository transition

This repository began as a 2-player Casino-style card game. The original game is now preserved and productized on the `capture-11` branch under the working title **Capture 11 (Cap 11)**.

`main` is now the home of the **Product Engine Microgame Engine** initiative.

The existing Casino-era source that remains on `main` is transitional reference code. It should be mined for reusable deck/rules/test patterns, not treated as the permanent engine layout.

## Product-line goal

Create a catalog of small games that are:

- quick to understand
- quick to launch
- playable in short sessions
- original and commercially safe
- accessible by default
- cheap to manufacture because they share infrastructure
- cheap to sell, generally around $0.99-$4.99 depending depth
- able to run without accounts, ads, telemetry, or recurring servers unless a future game explicitly earns those costs

## First games

### Capture 11
Branch: `capture-11`

Existing card-game code becomes the first reference product. Working price hypothesis: **$1.99-$2.99**.

### Critter Flip
Planned second reference game: an original memory/matching game with collectible original creatures, difficulty modes, and a Critter Book progression loop.

No third-party game IP is permitted in commercial builds without explicit rights.

## Engine contract

Every game should plug into common services instead of rebuilding them:

1. **Game Manifest**
   - id, title, version, age/content notes, price lane, save schema, supported input

2. **Shell / Navigation**
   - title screen
   - play / continue
   - settings
   - how to play
   - pause
   - results
   - restart / next round

3. **Input**
   - mouse
   - keyboard
   - touch where target supports it
   - controller later only if justified

4. **Accessibility**
   - scalable UI/text
   - keyboard navigability
   - visible focus
   - no color-only information
   - reduced-motion option where animation exists
   - independent sound/music levels
   - readable contrast
   - screen-reader-friendly menus where platform permits

5. **Save / Preferences**
   - local only by default
   - versioned JSON schema
   - atomic writes
   - no account required
   - game progress separated from shell settings

6. **Audio**
   - sound effects
   - music
   - mute
   - independent volume controls
   - commercially safe/original/licensed assets only

7. **Randomness / Determinism**
   - seedable random generator for tests where applicable
   - gameplay randomness isolated from UI

8. **Game Module Boundary**
   A game owns:
   - rules/state
   - scoring/win/loss logic
   - game-specific assets
   - game-specific tutorial copy

   The shell owns:
   - menus
   - settings
   - save plumbing
   - accessibility defaults
   - common input abstraction
   - build metadata
   - release packaging helpers

9. **Testing**
   - deterministic rules tests
   - save/load round trip
   - keyboard-only smoke test
   - 200% UI/layout check where applicable
   - clean first-run test
   - restart/reset test

10. **Release**
    - browser/HTML5 preferred when technically practical
    - lightweight desktop build is acceptable
    - zero-upfront-cost distribution first
    - no paid store registration until the catalog/revenue justifies it

## Microgame price lanes

These are hypotheses, not automatic prices:

- **$0.99-$1.99**: extremely small polished game
- **$2.99**: stronger microgame with progression/multiple modes
- **$3.99-$4.99**: bundle, deeper replayability, or several game modes

## Factory rule

A microgame does not need the same pain/WTP proof as a business utility, but it still needs a reason to exist.

Microgame promotion asks:

1. Is it fun within the first minute?
2. Is there a recognizable hook beyond a generic clone?
3. Can we build it mostly from the shared engine?
4. Can we legally sell every asset/mechanic presentation we ship?
5. Can the game be explained in one sentence or a 10-second clip?
6. Is the expected support burden close to zero?
7. Is the build small enough that weak sales do not hurt the factory?

## Branch model

- `main` = reusable Microgame Engine and shared contracts
- `capture-11` = Capture 11 product branch
- future product branches = one named branch per game until Product Engine evidence suggests separate repos are cleaner

## Current status

**ENGINE CONCEPT / REPO TRANSITION IN PROGRESS**

The contract and branch strategy are now established. The next PC work is to extract reusable shell/services from the existing game, choose the browser/desktop runtime strategy, and use Capture 11 plus Critter Flip as two reference implementations.
