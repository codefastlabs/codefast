---
"@internal/benchmark-viewer": patch
---

The viewer's Vite config keeps Vite's `development|production` condition beside its own, so a dependency's production
lane is what its build ships.
