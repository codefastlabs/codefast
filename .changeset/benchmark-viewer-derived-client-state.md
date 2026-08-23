---
"@codefast/benchmark-viewer": patch
---

Derive client-only view state without effect setState: the footer clocks and palette shortcut hint gate on a shared
hydration hook, the palette highlight becomes one epoch-tagged state with a derived index, and the chart drops its
sync-callback ref indirection.
