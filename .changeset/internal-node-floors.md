---
"@internal/benchmark-harness": patch
"@internal/benchmark-viewer": patch
"@internal/design-system": patch
"@benchmark/di": patch
"@benchmark/tailwind-variants": patch
---

Lower the Node.js floor to the lowest release each runs on: 22.18 for the benchmark harness, its viewer and the suites,
which need Node's built-in type stripping, and 22.22.2 for the design-system build, which needs jsdom.
