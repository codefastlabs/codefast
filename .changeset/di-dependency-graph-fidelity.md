---
"@codefast/di": minor
---

`generateDependencyGraph` now tells the whole wiring story instead of an approximation of it:

- **Optional dependencies are visible.** A bound optional dependency's edge carries an `optional` label; an unbound one
  now points at an `unbound:<token>` placeholder node (`kind`/`scope`: `"unbound"`) instead of silently disappearing —
  "optional and absent" is no longer indistinguishable from "not a dependency".
- **Multi-bindings fan out.** An `injectAll(...)` dependency draws an edge to every binding of the token, not just the
  first.
- **Class-constructor edges use slot labels.** A named or tagged constructor dependency is labeled `name:...`/`tag:...`
  like resolved-factory deps always were, and edge targets are filtered with the same slot-matching rules resolution
  uses (`matchesSlot`, SPEC §6.9) — an unnamed request no longer draws an edge to a named binding it could never
  resolve.
- **`includeParent` connects across the chain.** A child binding whose dependency is satisfied by the parent now gets
  its edge (own bindings still shadow the parent, mirroring resolution's upward walk).

`GraphNode["scope"]` widens from `BindingScope` to `BindingScope | "unbound"` for the placeholder nodes.
