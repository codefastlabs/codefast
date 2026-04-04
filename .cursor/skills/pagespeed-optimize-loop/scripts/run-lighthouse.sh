#!/usr/bin/env bash
# Run Lighthouse audits (desktop + mobile) and write JSON under round-NN.
#
# Usage: run-lighthouse.sh <base-url> [reports-root] [round-number] [categories]
#
#   base-url      The URL to audit (e.g. http://127.0.0.1:4173/)
#   reports-root  Base directory for reports (default: .cursor/pagespeed-reports)
#   round-number  Round index 1, 2, … → writes to reports-root/round-NN/
#   categories    Comma-separated Lighthouse categories (default: performance)
#                 Use "performance,accessibility,best-practices,seo" for full audit
#
# Examples (from repository root):
#   ./run-lighthouse.sh http://127.0.0.1:4173/ .cursor/pagespeed-reports 1
#   ./run-lighthouse.sh http://127.0.0.1:4173/ .cursor/pagespeed-reports 2 performance,accessibility,best-practices,seo
set -euo pipefail

BASE_URL="${1:?usage: run-lighthouse.sh <base-url> [reports-root] [round-number] [categories]}"
REPORTS_ROOT="${2:-.cursor/pagespeed-reports}"
ROUND="${3:-1}"
CATEGORIES="${4:-performance}"

if ! [[ "${ROUND}" =~ ^[1-9][0-9]*$ ]]; then
  echo "error: round-number must be a positive integer, got: ${ROUND}" >&2
  exit 1
fi

ROUND_DIR="${REPORTS_ROOT}/$(printf 'round-%02d' "${ROUND}")"
mkdir -p "$ROUND_DIR"

# Wait for server to be ready before auditing
echo "Waiting for server at ${BASE_URL}..."
until curl -sf "$BASE_URL" > /dev/null 2>&1; do sleep 1; done
echo "Server ready."

echo "Auditing categories: ${CATEGORIES}"

# Desktop
npx --yes lighthouse "$BASE_URL" \
  --preset=desktop \
  --only-categories="$CATEGORIES" \
  --output=json \
  --output-path="${ROUND_DIR}/lighthouse-desktop.json" \
  --chrome-flags="--headless --no-sandbox"

# Mobile — note: --form-factor=mobile already enables mobile screen emulation;
# --screenEmulation.mobile is not needed and has been removed.
npx --yes lighthouse "$BASE_URL" \
  --form-factor=mobile \
  --only-categories="$CATEGORIES" \
  --output=json \
  --output-path="${ROUND_DIR}/lighthouse-mobile.json" \
  --chrome-flags="--headless --no-sandbox"

echo "Wrote:"
echo "  ${ROUND_DIR}/lighthouse-desktop.json"
echo "  ${ROUND_DIR}/lighthouse-mobile.json"
