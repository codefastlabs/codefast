---
"@codefast/di": minor
---

A root-level `resolveAll` with no options memoizes its candidate list until any registry in the chain changes, and its
value list while every member is a hook-free constant with no activation hook anywhere in the chain. The contract
already required `when()` predicates to be pure; the engine now relies on it there, evaluating a predicate once per
container state for that read instead of on every call. Reads carrying options, or made from inside a factory, are
unchanged.
