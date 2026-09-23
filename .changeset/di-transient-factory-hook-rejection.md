---
"@codefast/di": patch
---

A rejected async `onActivation` on a transient `toDynamic` binding — per-binding or container-level — no longer surfaces
as an unhandled rejection: the sync resolve still throws `AsyncActivationError`, and the hook's promise is adopted as it
already was on every other lane.
