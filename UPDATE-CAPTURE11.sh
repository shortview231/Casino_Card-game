#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: This folder is not the Capture 11 Git checkout."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Local changes exist. Nothing was overwritten. Ask Codex to inspect this checkout."
  git status --short
  exit 1
fi

CURRENT="$(git branch --show-current)"
if [ "$CURRENT" != "capture-11-rebuild-v0.1" ]; then
  git switch capture-11-rebuild-v0.1
fi

BEFORE="$(git rev-parse --short HEAD)"
git fetch origin capture-11-rebuild-v0.1
git pull --ff-only origin capture-11-rebuild-v0.1
AFTER="$(git rev-parse --short HEAD)"

npm install --no-audit --no-fund
npm run build

echo "CAPTURE 11 UPDATED"
echo "Before: $BEFORE"
echo "Now:    $AFTER"
