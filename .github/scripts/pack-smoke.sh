#!/usr/bin/env bash
set -euo pipefail

# Pack each Node-consumable published package, install the tarballs into a throwaway consumer, and
# import each on the current Node. Catches module-resolution breaks — e.g. a "#/"-prefixed subpath
# import — that surface only through native Node, never through the in-repo runners (tsc/Vite/Vitest/tsx).
# Browser packages (ui, theme) are consumed through a bundler that resolves "#" itself, so they are
# validated by publint/attw instead of a native import here.

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PACKAGES=(di di-testing cli tailwind-variants tracking)

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/tars" "$tmp/app"

for pkg in "${PACKAGES[@]}"; do
  (cd "$ROOT/packages/$pkg" && pnpm pack --pack-destination "$tmp/tars" >/dev/null)
done

cd "$tmp/app"
printf '{"name":"pack-smoke","type":"module","private":true}\n' >package.json
# The @codefast tarballs resolve each other's workspace deps; react/tailwind-merge are the peers the set needs.
pnpm add "$tmp"/tars/*.tgz react react-dom tailwind-merge >/dev/null 2>&1

echo "pack-smoke on $(node --version)"
status=0
for pkg in "${PACKAGES[@]}"; do
  spec="@codefast/$pkg"
  if node --input-type=module -e "await import(process.argv[1])" "$spec" 2>"$tmp/err"; then
    echo "  ok   $spec"
  else
    echo "  FAIL $spec"
    sed 's/^/    /' "$tmp/err"
    status=1
  fi
done

exit "$status"
