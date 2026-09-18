#!/usr/bin/env bash
set -euo pipefail

# Validate each published package's manifest against the SLIMMED publish surface. `codefast pack-slim`
# strips the source condition and unshipped imports, so publint must see the slimmed shape — the dev
# manifest still carries the source fallback arrays publint (correctly) warns about.
#
# pack-slim mutates each package.json and its dist in place. Snapshot the manifests up front and
# restore them from that snapshot on exit outside CI (dist is rebuilt) — never `git checkout`, which
# would also discard any uncommitted work under packages/.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

snapshot="$(mktemp -d)"
for manifest in packages/*/package.json; do
  mkdir -p "$snapshot/$(dirname "$manifest")"
  cp "$manifest" "$snapshot/$manifest"
done
cleanup() {
  if [ -z "${CI:-}" ]; then
    for manifest in packages/*/package.json; do
      cp "$snapshot/$manifest" "$manifest"
    done
    pnpm build:packages >/dev/null 2>&1 || true
  fi
  rm -rf "$snapshot"
}
trap cleanup EXIT

pnpm run codefast pack-slim --force >/dev/null

status=0
for dir in packages/*/; do
  [ -f "${dir}package.json" ] || continue
  node -e "process.exit(require('./${dir}package.json').private ? 1 : 0)" || continue
  name="$(node -p "require('./${dir}package.json').name")"
  echo "== publint ${name} =="
  pnpm --filter "$name" exec publint || status=1
done

exit "$status"
