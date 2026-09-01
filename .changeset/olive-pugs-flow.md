---
"@codefast/di-testing": patch
---

Fold di's reserved `slotName` criterion into slot addressing, so `{ name: "x" }` and `{ tag: slotName.of("x") }` — one
slot to the container — are one slot to TestBed too: a mock registered with either spelling now matches a dependency
declared with the other, and `mocks.get(token, options)` accepts both.
