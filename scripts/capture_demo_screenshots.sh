#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/screenshots"
BOOTSTRAP_URL="http://127.0.0.1:8123/screenshots/bootstrap-demo.html"
TMP_PROFILE="$(mktemp -d /tmp/tripmind-shot-XXXXXX)"
SERVER_PID=""

cleanup() {
  if [[ -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
  rm -rf "${TMP_PROFILE}"
}
trap cleanup EXIT

if [[ ! -f "$OUT_DIR/bootstrap-demo.html" ]]; then
  echo "Missing $OUT_DIR/bootstrap-demo.html" >&2
  exit 1
fi

python3 -m http.server 8123 --bind 127.0.0.1 --directory "$ROOT_DIR" >/tmp/tripmind-shot-server.log 2>&1 &
SERVER_PID="$!"
sleep 1

CHROME_EXIT=0
timeout 45s google-chrome \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --remote-debugging-port=0 \
  --window-size=1800,2600 \
  --virtual-time-budget=18000 \
  --user-data-dir="$TMP_PROFILE" \
  --screenshot="$OUT_DIR/10-demo-full.png" \
  "$BOOTSTRAP_URL" || CHROME_EXIT=$?

if [[ ! -f "$OUT_DIR/10-demo-full.png" ]]; then
  echo "Failed to create screenshot (chrome exit $CHROME_EXIT)" >&2
  exit 1
fi

ffmpeg -y -i "$OUT_DIR/10-demo-full.png" -vf "crop=1340:760:430:90" "$OUT_DIR/11-hero-visual-board.png" >/dev/null 2>&1
ffmpeg -y -i "$OUT_DIR/10-demo-full.png" -vf "crop=1340:650:430:760" "$OUT_DIR/12-hero-map-panel.png" >/dev/null 2>&1
ffmpeg -y -i "$OUT_DIR/10-demo-full.png" -vf "crop=780:1160:430:1420" "$OUT_DIR/13-hero-itinerary.png" >/dev/null 2>&1
ffmpeg -y -i "$OUT_DIR/10-demo-full.png" -vf "crop=500:1780:0:80" "$OUT_DIR/14-hero-controls-chat.png" >/dev/null 2>&1

echo "Updated screenshots in $OUT_DIR"
