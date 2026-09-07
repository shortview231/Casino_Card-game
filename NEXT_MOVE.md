# Capture 11 Next Move

## Current task

Establish and verify the permanent local Linux workflow using the existing Git clone.

Codex should:

1. Confirm the current folder is the correct Git clone for `shortview231/Casino_Card-game`.
2. Confirm branch `capture-11-rebuild-v0.1`.
3. Run `bash ./UPDATE-CAPTURE11.sh`.
4. Run `bash ./PLAY-CAPTURE11.sh`.
5. Verify the actual browser shows Capture 11 and not another localhost app.
6. Verify the current accessibility build is visible:
   - clearly differentiated suits
   - S/H/D/C suit identifiers
   - CPU played-card reveal
   - persistent Last CPU Play panel
7. If any of those are missing, fix the local workflow or game code as needed, rebuild, and verify again.

## Completion condition

This task is complete only when the local browser visibly shows the expected current Capture 11 build from the persistent Git checkout.

## After completion

Set the next task to the highest-priority issue discovered during the user's next real playtest. Do not invent speculative work if no issue has been reported.
