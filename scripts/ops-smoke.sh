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

check_music_cors_post() {
  local response code origins origin_count

  response="$(/usr/bin/curl -sS -D - -o /dev/null \
    -w '\n__HTTP_CODE__=%{http_code}\n' \
    --connect-timeout 5 --max-time 20 \
    -X POST 'https://api.soda567.dpdns.org/api/music/presigned-upload' \
    -H 'Origin: https://soda567.dpdns.org' \
    -H 'Content-Type: application/json' \
    --data '{}' \
    2>/dev/null || true)"
  code="$(printf '%s\n' "$response" | awk -F= '/^__HTTP_CODE__=/{print $2}' | tail -n 1)"
  origins="$(printf '%s\n' "$response" | tr -d '\r' | awk 'tolower($1) == "access-control-allow-origin:" {print $2}')"
  origin_count="$(printf '%s\n' "$origins" | awk 'NF {count++} END {print count + 0}')"

  # The empty payload is intentionally rejected, but it still traverses the
  # real POST proxy path without creating a ticket or an R2 object.
  if [ "$code" = "400" ] && [ "$origin_count" = "1" ] && ! printf '%s' "$origins" | grep -q ','; then
    printf 'OK   %-18s HTTP %s, one allow-origin header\n' "music CORS POST" "$code"
    return 0
  fi

  printf 'FAIL %-18s HTTP %s, allow-origin headers=%s values=%s\n' \
    "music CORS POST" "${code:-000}" "$origin_count" "${origins:-missing}" >&2
  return 1
}

check_post_contract() {
  local name="$1" path="$2" payload="$3" expected_code="$4"
  local response code origins origin_count

  response="$(/usr/bin/curl -sS -D - -o /dev/null \
    -w '\n__HTTP_CODE__=%{http_code}\n' \
    --connect-timeout 5 --max-time 20 \
    -X POST "https://api.soda567.dpdns.org${path}" \
    -H 'Origin: https://soda567.dpdns.org' \
    -H 'Content-Type: application/json' \
    --data "$payload" 2>/dev/null || true)"
  code="$(printf '%s\n' "$response" | awk -F= '/^__HTTP_CODE__=/{print $2}' | tail -n 1)"
  origins="$(printf '%s\n' "$response" | tr -d '\r' | awk 'tolower($1) == "access-control-allow-origin:" {print $2}')"
  origin_count="$(printf '%s\n' "$origins" | awk 'NF {count++} END {print count + 0}')"

  if [ "$code" = "$expected_code" ] && [ "$origin_count" = "1" ] && [ "$origins" = "https://soda567.dpdns.org" ]; then
    printf 'OK   %-18s HTTP %s, exact CORS\n' "$name" "$code"
    return 0
  fi
  printf 'FAIL %-18s HTTP %s, allow-origin headers=%s values=%s\n' "$name" "${code:-000}" "$origin_count" "${origins:-missing}" >&2
  return 1
}

failures=0
check "local readiness" "http://127.0.0.1:5001/api/ready" || failures=$((failures + 1))
check "local music" "http://127.0.0.1:5062/api/music/health" || failures=$((failures + 1))
check "local whisper" "http://127.0.0.1:5003/api/health" || failures=$((failures + 1))
check "public API" "https://api.soda567.dpdns.org/api/ready" || failures=$((failures + 1))
check_music_cors_post || failures=$((failures + 1))
check_post_contract "transcribe route" "/api/transcribe/presigned-upload" '{"filename":"route-probe.txt","size":1}' "400" || failures=$((failures + 1))
check_post_contract "douyin route" "/api/transcribe/douyin" '{"url":"invalid-route-probe"}' "400" || failures=$((failures + 1))
check_post_contract "subtitle route" "/api/video-subtitle-remover/uploads" '{"filename":"route-probe.txt","size":1}' "400" || failures=$((failures + 1))
check "public admin" "https://soda567.dpdns.org/admin" || failures=$((failures + 1))
check "public music tool" "https://soda567.dpdns.org/tools/music-converter.html" || failures=$((failures + 1))

exit "$failures"
