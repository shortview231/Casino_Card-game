# Capture 11 Codex Handoff

This repository and branch are the source of truth for the Capture 11 Linux playtest.

## Required branch

`capture-11-rebuild-v0.1`

## Division of responsibility

- ChatGPT may update game code in GitHub on the required branch.
- Codex owns only the user's local Linux checkout, launcher, local verification, and machine-specific troubleshooting unless the user explicitly asks Codex to edit game code.
- Do not create ZIP-based update workflows.
- Do not create duplicate project copies unless the user explicitly asks.
- Do not guess filesystem paths. Inspect with `pwd`, `ls`, `find`, or Git before acting.

## Permanent local model

There should be one persistent Git clone on the user's Linux PC. Once it exists, all future updates happen through Git pull, never by downloading a new ZIP.

The local checkout should track:

- repository: `https://github.com/shortview231/Casino_Card-game.git`
- branch: `capture-11-rebuild-v0.1`

## Existing repo commands

From the repository root:

- update/build: `bash ./UPDATE-CAPTURE11.sh`
- play: `bash ./PLAY-CAPTURE11.sh`
- stop local playtest server: `bash ./STOP-CAPTURE11.sh`

These scripts are part of the repository and should be treated as the standard local workflow.

## Ports

- Never use or kill port `8765`; it belongs to another Lucid Vision service.
- The Capture 11 launcher chooses its own available port beginning at `43111` and records only its own PID/port.
- Never kill an arbitrary process merely because a preferred port is occupied.

## Local setup task for Codex

On first use only:

1. Inspect the user's filesystem and find whether a Git clone of this repo already exists.
2. If a valid clone exists, reuse it instead of cloning another copy.
3. If no valid clone exists, ask the user where the single permanent clone should live or use a path the user has explicitly approved.
4. Ensure the clone is on `capture-11-rebuild-v0.1`.
5. Run `npm install --no-audit --no-fund`.
6. Run `bash ./UPDATE-CAPTURE11.sh`.
7. Run `bash ./PLAY-CAPTURE11.sh` and visually verify that Capture 11, not another localhost app, opens.
8. Optionally create a desktop launcher that executes `PLAY-CAPTURE11.sh` from that verified clone.

## Verification target

Current expected playtest features include:

- four visually differentiated suits
- suit letters S/H/D/C plus suit symbols
- CPU played-card reveal before board resolution
- persistent Last CPU Play information
- Capture 11 Human vs CPU gameplay

Do not report success until the actual local browser view has been checked.
