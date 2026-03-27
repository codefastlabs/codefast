#!/usr/bin/env bash
# Run Lighthouse performance audits (desktop + mobile) and write JSON under round-NN.
#
# Usage: run-lighthouse.sh <base-url> [reports-root] [round-number]
#   reports-root  Base directory for reports (default: .cursor/pagespeed-reports)
#   round-number  Round index 1, 2, … → writes to reports-root/round-NN/
#
# Example (from repository root):
#   ./run-lighthouse.sh http://127.0.0.1:4173/ .cursor/pagespeed-reports 1
set -euo pipefail

BASE_URL="${1:?usage: run-lighthouse.sh <base-url> [reports-root] [round-number]}"
REPORTS_ROOT="${2:-.cursor/pagespeed-reports}"
ROUND="${3:-1}"

if ! [[ "${ROUND}" =~ ^[1-9][0-9]*$ ]]; then
  echo "error: round-number must be a positive integer, got: ${ROUND}" >&2
  exit 1
fi

ROUND_DIR="${REPORTS_ROOT}/$(printf 'round-%02d' "${ROUND}")"
mkdir -p "$ROUND_DIR"

npx --yes lighthouse "$BASE_URL" \
  --preset=desktop \
  --only-categories=performance \
  --output=json \
  --output-path="${ROUND_DIR}/lighthouse-desktop.json" \
  --chrome-flags="--headless --no-sandbox"

npx --yes lighthouse "$BASE_URL" \
  --form-factor=mobile \
  --screenEmulation.mobile=true \
  --only-categories=performance \
  --output=json \
  --output-path="${ROUND_DIR}/lighthouse-mobile.json" \
  --chrome-flags="--headless --no-sandbox"

echo "Wrote: ${ROUND_DIR}/lighthouse-desktop.json ${ROUND_DIR}/lighthouse-mobile.json"
