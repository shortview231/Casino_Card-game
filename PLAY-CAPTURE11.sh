#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PIDFILE="$ROOT/.capture11-server.pid"
PORTFILE="$ROOT/.capture11-server.port"
LOGFILE="$ROOT/.capture11-server.log"

if [ ! -f "$ROOT/dist/index.html" ]; then
  echo "No build found. Building Capture 11 first..."
  npm install --no-audit --no-fund
  npm run build
fi

if [ -f "$PIDFILE" ]; then
  OLD_PID="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    kill "$OLD_PID" 2>/dev/null || true
    sleep 0.5
  fi
  rm -f "$PIDFILE" "$PORTFILE"
fi

PORT="$(python3 - <<'PY'
import socket
for port in range(43111, 43212):
    s = socket.socket()
    try:
        s.bind(('127.0.0.1', port))
    except OSError:
        s.close()
        continue
    s.close()
    print(port)
    raise SystemExit
raise SystemExit('No free Capture 11 port found')
PY
)"

cd "$ROOT/dist"
if command -v setsid >/dev/null 2>&1; then
  setsid python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOGFILE" 2>&1 < /dev/null &
else
  nohup python3 -m http.server "$PORT" --bind 127.0.0.1 >"$LOGFILE" 2>&1 < /dev/null &
fi
PID=$!
echo "$PID" > "$PIDFILE"
echo "$PORT" > "$PORTFILE"

for _ in $(seq 1 30); do
  if python3 - "$PORT" <<'PY'
import sys, urllib.request
port = sys.argv[1]
try:
    text = urllib.request.urlopen(f'http://127.0.0.1:{port}/', timeout=.3).read().decode('utf-8', 'ignore')
except Exception:
    raise SystemExit(1)
raise SystemExit(0 if 'game-root' in text else 1)
PY
  then
    break
  fi
  sleep 0.1
done

if ! kill -0 "$PID" 2>/dev/null; then
  echo "ERROR: Capture 11 local server failed to start."
  cat "$LOGFILE" 2>/dev/null || true
  exit 1
fi

BUILD="$(git rev-parse --short HEAD 2>/dev/null || echo local)"
URL="http://127.0.0.1:${PORT}/?capture11=${BUILD}"
echo "Capture 11: $URL"
xdg-open "$URL" >/dev/null 2>&1 || true
