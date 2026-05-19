#!/usr/bin/env bash
# Serve Encore locally so the player can load demo/complicated.mp3
cd "$(dirname "$0")"
PORT="${1:-8765}"
echo "Encore → http://127.0.0.1:${PORT}/landing.html"
echo "Player → http://127.0.0.1:${PORT}/player/index.html?showcase=1"
exec python3 -m http.server "$PORT"
