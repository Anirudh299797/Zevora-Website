#!/bin/bash
cd "$(dirname "$0")"
python3 -m http.server 8765 >/tmp/zevora.log 2>&1 &
PID=$!
sleep 1
open "http://127.0.0.1:8765/"
echo "ZEVORA is running at http://127.0.0.1:8765/"
trap "kill $PID 2>/dev/null" EXIT
wait $PID
