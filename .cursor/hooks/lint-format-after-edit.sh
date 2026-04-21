#!/usr/bin/env bash
set -euo pipefail

# Cursor afterFileEdit: consume hook JSON from stdin.
cat >/dev/null

pnpm check:fix
