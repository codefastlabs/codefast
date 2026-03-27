#!/usr/bin/env bash
# Delete the PageSpeed/Lighthouse report directory after work is finished (no JSON left in the repo).
# Run from the repository root (or pass an absolute path).
#
# Usage: remove-pagespeed-reports.sh [reports-root]
#   reports-root  Directory to remove (default: .cursor/pagespeed-reports)
set -euo pipefail

REPORTS_ROOT="${1:-.cursor/pagespeed-reports}"
rm -rf "$REPORTS_ROOT"
echo "Removed: ${REPORTS_ROOT}"
