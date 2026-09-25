#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PIDFILE="$ROOT/.capture11-server.pid"
PORTFILE="$ROOT/.capture11-server.port"

if [ ! -f "$PIDFILE" ]; then
  echo "Capture 11 server is not running."
  exit 0
fi

PID="$(cat "$PIDFILE" 2>/dev/null || true)"
if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Capture 11 stopped."
else
  echo "Capture 11 server was already stopped."
fi

rm -f "$PIDFILE" "$PORTFILE"
