---
"@benchmark/di": patch
---

`RESULTS.md` is regenerated from a pass over the tree with accessors compiled into plans and a shared root collection.
Every competitor reads level with the previous pass. `accessor-injection-construct` and `realistic-graph-validate` rise
with their changes, and the three stable-set rows now lead ditox and injection-js, so their loss note is gone and ditox
takes eight rows where it took ten. `realistic-graph-resolve-root` gets a note of its own: injection-js runs it at one
of two speeds per process, and this pass caught the faster one.
