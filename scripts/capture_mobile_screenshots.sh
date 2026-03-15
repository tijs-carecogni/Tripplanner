#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/screenshots"
BOOTSTRAP_URL="http://127.0.0.1:8124/screenshots/bootstrap-demo.html"
TMP_PROFILE="$(mktemp -d /tmp/tripmind-mobile-shot-XXXXXX)"
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

python3 -m http.server 8124 --bind 127.0.0.1 --directory "$ROOT_DIR" >/tmp/tripmind-mobile-shot-server.log 2>&1 &
SERVER_PID="$!"
sleep 1

CHROME_EXIT=0
timeout 45s google-chrome \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --remote-debugging-port=0 \
  --window-size=430,3200 \
  --virtual-time-budget=18000 \
  --user-data-dir="$TMP_PROFILE" \
  --screenshot="$OUT_DIR/20-mobile-full.png" \
  "$BOOTSTRAP_URL" || CHROME_EXIT=$?

if [[ ! -f "$OUT_DIR/20-mobile-full.png" ]]; then
  echo "Failed to create mobile screenshot (chrome exit $CHROME_EXIT)" >&2
  exit 1
fi

ffmpeg -y -i "$OUT_DIR/20-mobile-full.png" -vf "crop=430:760:0:80" "$OUT_DIR/21-mobile-visual-board.png" >/dev/null 2>&1
ffmpeg -y -i "$OUT_DIR/20-mobile-full.png" -vf "crop=430:820:0:860" "$OUT_DIR/22-mobile-map-itinerary.png" >/dev/null 2>&1

echo "Updated mobile screenshots in $OUT_DIR"
