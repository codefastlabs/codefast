---
"@codefast/di": minor
---

`many()` marks a binding as a collection member: several members of one token coexist on the default slot, `resolveAll`
returns every member, a single `resolve` never selects one, and membership replaces slot last-wins. A member keeps the
default slot (`ManyBindingSlotError` otherwise) and may carry `when()` predicates. It is the intended form of a strategy
set, where a predicate that always passes used to stand in — and it is what lets a root-level collection of constants be
served from its memo without evaluating anything. `BindingSnapshot` gains `isMany`.
