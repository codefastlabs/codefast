---
"@codefast/di": minor
---

A compiled plan now settles a name-only dependency at compile time instead of escaping to the runtime for it. A dependency escaped as soon as it carried any criterion, before anything tried to look it up — yet `whenNamed` writes the binding's slot name rather than a predicate, so a name-only request is usually a plain hit in the registry's named index, and that index is already memoized on the same registry version the plan cache is keyed on. Four named constants injected into one class stop escaping and become four `() => value` thunks.

The row that measures exactly that shape, `slot-injected-name-compiled`, reads **4.06×** the previous build, paired and alternating over twelve passes with every pass above 3.87×, while its interpreted twin and eleven control rows hold parity. Allocation on the same shape falls from 1260 to 366 scavenges per 2M resolves — level with the criteria-free plan of the same arity, so the compiled lane no longer allocates more than the interpreted path it exists to beat.

Selection is only baked in when it cannot depend on the resolution path: the candidate must carry no predicate and its slot must match the request. A predicate reads the path, so it stays the runtime's to evaluate, and anything else — a tag, a miss, an ambiguous name — escapes exactly as before.

`InstantiationPlanHost` gains `lookupPathIndependentNamedEntry`. **Breaking** for anything implementing that interface directly, which the package exposes on the `./resolution/plan/instantiation-plan` subpath.
