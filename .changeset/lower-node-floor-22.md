---
"@codefast/di": patch
"@codefast/di-testing": patch
"@codefast/ui": patch
"@codefast/theme": patch
"@codefast/tracking": patch
"@codefast/tailwind-variants": patch
"@codefast/cli": patch
"@codefast/typescript-config": patch
"@benchmark/di": patch
"@benchmark/tailwind-variants": patch
"@internal/benchmark-harness": patch
"@internal/benchmark-viewer": patch
---

Lower the monorepo's Node floor from 24 to 22.12, so the packages install and run on the active Node 22 LTS line.

`engines.node` becomes `>=22.12.0` across every package — the floor the shared toolchain (oxlint, Vite, Vitest, TanStack
Start) already requires — and `.node-version` moves to the latest 22 LTS so local and CI runs exercise that floor rather
than a newer engine. `@types/node` is pinned to the floor's major (`^22`), with a workspace override holding the whole
tree there so a dev tool's `@types/node: "*"` peer can no longer pull a newer major and mask an API the floor lacks. The
floor stays mechanical, not advisory: `@codefast/di` keeps its own `Map` upsert helpers rather than the ES2025
`Map.prototype.getOrInsert` (which would raise the floor to 26) and its `lib` stays `ES2024`. `@codefast/cli`'s mirror
step now calls the `node:path` functions directly instead of aliasing them, which the floor's types correctly flag as
unbound methods.
