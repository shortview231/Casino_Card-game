# Capture 11 Next Move

## Current task: rebuild the game to the approved UI target

The user rejected the presentation in commit `7691587` as visually worse than the intended product. Do not treat that layout as a completed visual direction.

The authoritative visual target is stored in this repository at:

`docs/ui-reference/capture11-final-ui-goal.jpg`

Open that image before editing. Use it as the primary reference for composition, hierarchy, proportions, chrome, table layout, and overall finished-product feel.

## Required result

Rebuild the live Capture 11 UI so it visibly approaches the reference image, while keeping the existing working rules engine and low-vision accessibility behavior.

The game should have:

- a polished dark desktop-card-game shell, not a white/flat web-form layout
- branded Capture 11 area and left-side navigation
- CPU status/hand/score zone across the top
- a large central teal/green felt table as the dominant visual area
- draw deck at the left of the table and discard pile at the right
- clearly separated board cards centered on the felt
- a dedicated player-hand zone below the table
- bottom player status/score strip
- right-side game information and turn-action panels
- visible CPU captures and player scoring/status areas
- strong panel framing, depth, borders, and restrained blue/red accent glow similar to the reference
- readable card faces with familiar standard-card proportions
- no giant empty felt area with tiny content clustered at the upper left
- no full-width white status bars dominating the screen
- no developer-test-page appearance

## Accessibility stays mandatory

Do not sacrifice readability to imitate the reference.

Keep or improve:

- large readable card rank and suit
- redundant suit cues, including suit letter + symbol; color may supplement but never replace them
- clearly distinguishable suits
- readable CPU played-card preview with full card name
- persistent LAST CPU PLAY information after resolution
- readable builds and captured cards
- keyboard/touch/mouse operation

## Implementation rule

Do not use the reference image itself as a background or fake screenshot. Recreate the layout with functional HTML/CSS/components using the real game state.

This is a structural UI rebuild, not a few CSS token changes. It is acceptable to substantially reorganize Capture 11 markup and CSS as long as gameplay behavior and tests remain intact.

## Verification

Launch the permanent local checkout in actual Chromium and compare it side-by-side with `docs/ui-reference/capture11-final-ui-goal.jpg`.

Do not report completion until a first glance clearly shows the same design family and layout structure as the reference:

1. dark framed game shell
2. left navigation
3. top CPU zone
4. central felt table
5. board centered on table with deck/discard flanking it
6. player hand below
7. right action/info rail
8. bottom player status area
9. cards remain low-vision readable

Run typecheck, tests, and build after the visual rebuild.

When complete, show the user the actual browser result before moving to automated regression work.
