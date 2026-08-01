---
"@codefast/di": minor
---

Publish every module as an entry point again — the sole-consumer repo prefers full access over encapsulation. The 0.5.0 surface reduction (13 subpaths) is reverted: `resolution/*`, `registry`, `container/*`, `binding`, `constructor-type`, and the `metadata` internals are entry points once more. Introspection modules keep the flat specifiers they have always shipped under (`./inspector`, `./dependency-graph`, `./graph-adapters/*`).
