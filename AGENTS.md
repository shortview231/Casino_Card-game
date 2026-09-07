# Capture 11 Codex Handoff

This repository and branch are the source of truth for the Capture 11 Linux playtest.

## Required branch

`capture-11-rebuild-v0.1`

## Primary user command

When the user says exactly or approximately:

`do next move`

Codex must NOT ask for a long prompt. Treat that phrase as authorization to continue the Capture 11 workflow below.

On `do next move`:

1. Confirm you are inside the existing local clone of `shortview231/Casino_Card-game`.
2. Do not guess the path. Use the current working directory, Git metadata, `pwd`, `git remote -v`, and `git branch --show-current`.
3. Read this `AGENTS.md` and `NEXT_MOVE.md`.
4. Pull the latest `capture-11-rebuild-v0.1` branch using the existing repo workflow.
5. Execute the current unblocked task in `NEXT_MOVE.md`.
6. Verify the result locally before reporting success.
7. Update `NEXT_MOVE.md` only when the task is actually complete and the next task is known.
8. Give the user a very short completion report.

Do not require the user to restate repository, branch, paths, ports, or setup instructions on each turn.

## Division of responsibility

- ChatGPT may update game code in GitHub on the required branch.
- Codex owns the user's local Linux checkout, launcher, local verification, and machine-specific troubleshooting.
- Codex may edit game code when `NEXT_MOVE.md` explicitly assigns it a code task or when the user directly asks Codex to fix something.
- Do not create ZIP-based update workflows.
- Do not create duplicate project copies unless the user explicitly asks.
- Do not guess filesystem paths.

## Permanent local model

Use one persistent Git clone only.

Repository:
`https://github.com/shortview231/Casino_Card-game.git`

Branch:
`capture-11-rebuild-v0.1`

## Standard commands

From the repository root:

- update/build: `bash ./UPDATE-CAPTURE11.sh`
- play: `bash ./PLAY-CAPTURE11.sh`
- stop: `bash ./STOP-CAPTURE11.sh`

## Ports

- Never use or kill port `8765`; it belongs to another Lucid Vision service.
- Capture 11 chooses its own available port beginning at `43111` and records only its own PID/port.
- Never kill an arbitrary process merely because a preferred port is occupied.

## Verification rules

Do not report success from source inspection alone.

For UI/gameplay tasks, verify the actual local browser view.
For build tasks, verify the command exits successfully.
For launcher tasks, verify the correct Capture 11 page opens.

Current expected accessibility features include:

- four visually differentiated suits
- S/H/D/C suit letters plus suit symbols
- CPU played-card reveal before board resolution
- persistent Last CPU Play information
- Capture 11 Human vs CPU gameplay
