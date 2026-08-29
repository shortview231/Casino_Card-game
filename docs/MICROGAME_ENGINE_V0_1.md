# Microgame Engine v0.1 Contract

Status: design contract / implementation pending

## Objective

Create one small reusable game framework that makes the second, third, and tenth microgame cheaper than the first.

## Non-goals

v0.1 is not:
- a general-purpose game engine competing with Unity/Godot
- an online multiplayer backend
- an ad network/in-app-purchase framework
- a live-service platform
- a third-party IP wrapper

## Core interfaces

### GameDefinition
Each game must provide:
- `id`
- `title`
- `version`
- `create_new_game()`
- `load_game(payload)`
- `serialize_game(state)`
- `get_view_model(state)`
- `handle_action(state, action)`
- `is_round_over(state)`
- `get_results(state)`

### Shell services
Shared engine provides:
- launch/title screen
- game registration
- settings storage
- pause/resume
- save/load helpers
- common modal/dialog system
- common result/restart flow
- accessibility preferences
- common audio controls
- seeded RNG helper
- version/build display

### Action model
Inputs should become semantic actions before reaching rules logic.
Examples:
- `NAV_UP`
- `NAV_DOWN`
- `CONFIRM`
- `CANCEL`
- `PAUSE`
- `SELECT_CARD(index)`
- `SELECT_TILE(index)`
- `ROLL_DICE`

Game rules should not care whether an action came from mouse, touch, keyboard, or controller.

## Save contract

Shell settings and game progress are separated.

Example:
```json
{
  "schema_version": 1,
  "game_id": "capture-11",
  "game_version": "0.1.0",
  "updated_at": "ISO-8601 timestamp",
  "payload": {}
}
```

Rules:
- local storage by default
- version every save schema
- atomic/recoverable write where runtime permits
- corrupted save must fail safely and preserve recoverable original
- never require an account for core play

## Accessibility contract

Every shared screen must support:
- keyboard-only navigation
- visible focus
- scalable text/UI
- no color-only status
- high-contrast-safe UI tokens
- reduced motion toggle
- separate SFX/music volume
- mute

Game-specific screens must document any accessibility limitation before release.

## Art/IP contract

Commercial release must use:
- original art/audio, or
- public-domain assets with verified provenance, or
- assets under licenses explicitly compatible with commercial redistribution.

Do not use Pokémon, Nintendo characters, logos, sprites, names, music, or other third-party entertainment IP without explicit commercial rights.

## Runtime decision gate

v0.1 should compare at least:
1. HTML5/browser-first implementation
2. lightweight Python desktop implementation based on current Capture 11 code
3. Godot only if the first two options create more packaging/UI friction than they remove

Decision criteria:
- zero upfront cost
- export friction
- touch/browser support
- accessibility
- package size
- automated testing
- reuse speed
- itch.io friendliness

## Reference-game requirement

The engine is not considered v0.1 proven until two structurally different games work on it:

1. **Capture 11**: card/rules/AI game
2. **Critter Flip**: memory/tile/progression game

If both need the same shell unchanged, reuse is real. If every game forces shell rewrites, the contract is too abstract or wrong.

## Engine v0.1 pass criteria

- two games register through the same manifest/module interface
- common title/settings/pause/results flow works for both
- saves are isolated per game
- shared accessibility preferences persist
- keyboard navigation works
- a clean package can be generated without hand-editing game internals
- one browser or desktop distribution target is reproducible
- no game-specific business logic leaks into shared shell
