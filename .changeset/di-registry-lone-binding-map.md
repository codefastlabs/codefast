---
"@codefast/di": patch
---

Keep the common token — one default-slot binding, no predicate — in the registry's fast-default map alone, and give a
record (binding list plus tagged indexes) only to a token that carries a second binding, a tagged slot or a predicate,
moving it back when the record shrinks to the default slot. A plain bind is now one map write and one binding object;
`getFastDefault()` is unchanged, a bare `Map.get` on that map, and `has()`/`hasOwn()` without criteria answer from a
registry presence probe instead of materialising the token's list. `RESOLUTION_DIAGNOSTICS` reports the record map under
`registry.records`.
