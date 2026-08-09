---
"@codefast/di": minor
---

A dependency slot that carries a name or a tag no longer rebuilds its `ResolveOptions` on every hop. The criteria are fixed when the slot is declared, so the derived options are too; they are now built once and memoized on the slot itself, which is sound to share across containers because they derive from the slot alone. A slot carrying no criterion answers from its two fields without calling the builder at all, so the common shape never reaches the memo. A frozen slot — which a custom `MetadataReader` may hand out — keeps rebuilding rather than throwing.

The memoized object is frozen, because sharing it has a consequence: a constraint predicate is handed it as `currentResolveOptions`, and `ResolveOptions` declares mutable fields, so a write through that reference would rewrite what the dependency asks for on every later resolve. Frozen, the attempt throws where it is made. Paired A/B over six rows and twelve passes puts the freeze inside noise — the control that cannot be affected by it moved as much as the row that can.

`resolveOptionsForSlot` and the `DependencySlot` type are exported, so the memoizing form is reachable and the slot it takes has a name a consumer can write down.

This is an allocation change, not a throughput one, and the distinction is worth stating because only one lane ever paid. A compiled plan already derives a criteria-carrying param's options at compile time and captures them in its escape thunk; the interpreted path had no such moment, so it minted an options object per hop, per resolve. Counted as scavenges per 2M resolves under a 1 MB young generation (`pnpm --filter @codefast/benchmark-di-inversify instrument:alloc`), a four-named-dependency class whose plan is declined went 870 → 442, landing exactly on the criteria-free control's 443, while the compiled lane sat at 1260 on both builds. A paired benchmark A/B across all 65 rows reads flat — correctly, since none of them injected a criteria-carrying dependency until two rows were added for the lane.
