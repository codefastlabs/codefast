---
"@codefast/di": patch
---

A constant with an `onDeactivation` hook that a bind inside a module load displaces now runs that hook at `dispose()`,
as it already did when a plain `container.bind()` displaced it. A module's chains registered without the container's
displacement bookkeeping, so the displaced constant left the registry untracked and nothing ever tore it down; this held
for `Module.create` setups and declared modules (`Module.fromBindings`) alike. Unloading the displacing module still
does not restore the displaced binding — its deactivation stays owed to `dispose()`.
