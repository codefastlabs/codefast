---
"@codefast/di": patch
---

Fix a tag request answering differently depending on how it was spelled. `resolve(T, { tags: [["n", -0]] })`
matched a binding tagged `["n", 0]` while `resolve(T, { tag: ["n", -0] })` threw `NoMatchingBindingError`
and `resolveAll` returned `[]` — three answers to one question.

The registry indexes tagged bindings in a `Map`, so it answers by SameValueZero, while tag values compare
by `Object.is` as SPEC §3.5 requires; the two differ on `+0` versus `-0`. The fast path now re-checks the
index's answer, and only where the index can be wrong — a request whose tag value is not zero was already
exact. `NaN` was never affected: both rules treat it as equal to itself.
