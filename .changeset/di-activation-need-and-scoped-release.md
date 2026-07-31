---
"@codefast/di": patch
---

Fix three defects found by an audit of the resolution engine's memoization:

- A `.onActivation()` hook added to a chain **after** its binding's first resolve was silently skipped on every lane that consults the activation-need memo (named resolves and nested dependency resolves) while the default-slot dynamic lane honored it. The memo now reads the binding's own hook fresh on every call, so all lanes give one answer.
- The activation-need memo is keyed by binding id and was only invalidated by the lifecycle version, so a long-running container that rebinds in a loop grew it without bound (~60 B per rebind). The memo is now also stamped with the registry version, evicting entries whose binding ids a rebind has retired.
- A `scoped` instance cached in a child container survived `unbind`/`unbindAll`/module unload — the drain released singletons only. Scoped entries are now released with their binding (no deactivation, per SPEC §5.2), and resolution diagnostics expose a `scopedInstanceCount` so the release is pinned structurally.

A paired A/B against the previous build over six activation- and dispatch-sensitive rows (three passes, alternating order) held every row within noise of parity.
