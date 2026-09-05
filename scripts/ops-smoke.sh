#!/bin/bash
set -u

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"
  local code

  code="$(/usr/bin/curl --noproxy '*' -sS -L -o /dev/null -w '%{http_code}' --connect-timeout 5 --max-time 20 "$url" 2>/dev/null || true)"
  if [ "$code" = "$expected" ]; then
    printf 'OK   %-18s HTTP %s\n' "$name" "$code"
    return 0
  fi

  printf 'FAIL %-18s HTTP %s (expected %s)\n' "$name" "${code:-000}" "$expected" >&2
  return 1
}

failures=0
check "local readiness" "http://127.0.0.1:5001/api/ready" || failures=$((failures + 1))
check "local music" "http://127.0.0.1:5062/api/music/health" || failures=$((failures + 1))
check "local whisper" "http://127.0.0.1:5003/api/health" || failures=$((failures + 1))
check "public API" "https://api.soda567.dpdns.org/api/ready" || failures=$((failures + 1))
check "public admin" "https://soda567.dpdns.org/admin" || failures=$((failures + 1))
check "public music tool" "https://soda567.dpdns.org/tools/music-converter.html" || failures=$((failures + 1))

exit "$failures"
