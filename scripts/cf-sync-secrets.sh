#!/usr/bin/env bash
# Upload AI_API_KEY from .env.local to Cloudflare (run once after deploy setup).
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "Missing .env.local"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [[ -z "${AI_API_KEY:-}" ]]; then
  echo "AI_API_KEY is empty in .env.local"
  exit 1
fi

printf '%s' "$AI_API_KEY" | npx wrangler secret put AI_API_KEY
echo "AI_API_KEY uploaded."
