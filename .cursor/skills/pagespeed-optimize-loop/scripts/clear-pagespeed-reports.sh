#!/usr/bin/env bash
# Remove and recreate the PageSpeed/Lighthouse report directory before a new skill session.
# After work is done, use remove-pagespeed-reports.sh instead so the folder is not left behind.
# Run from the repository root (or pass an absolute path).
#
# Usage: clear-pagespeed-reports.sh [reports-root]
#   reports-root  Directory to reset (default: .cursor/pagespeed-reports)
set -euo pipefail

REPORTS_ROOT="${1:-.cursor/pagespeed-reports}"
rm -rf "$REPORTS_ROOT"
mkdir -p "$REPORTS_ROOT"
echo "Cleared and recreated: ${REPORTS_ROOT}"
