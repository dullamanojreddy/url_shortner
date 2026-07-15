#!/usr/bin/env bash
# Seed script: register a test user and create a few short URLs
# Usage: BASE_URL=http://localhost bash scripts/seed.sh

BASE_URL=${BASE_URL:-http://localhost}

echo "── Registering test user ──────────────────────────────────────"
REGISTER=$(curl -s -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}')
echo "$REGISTER" | python3 -m json.tool 2>/dev/null || echo "$REGISTER"

TOKEN=$(echo "$REGISTER" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "── Logging in ─────────────────────────────────────────────────"
  LOGIN=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')
  TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
fi

echo ""
echo "── Creating short URLs ─────────────────────────────────────────"

curl -s -X POST "$BASE_URL/api/v1/urls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://google.com","customAlias":"google","expiry":"30d","title":"Google"}' \
  | python3 -m json.tool

curl -s -X POST "$BASE_URL/api/v1/urls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://github.com","customAlias":"gh","title":"GitHub"}' \
  | python3 -m json.tool

curl -s -X POST "$BASE_URL/api/v1/urls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://openai.com","expiry":"7d","title":"OpenAI"}' \
  | python3 -m json.tool

echo ""
echo "── Done! Try: curl -L $BASE_URL/google ────────────────────────"
