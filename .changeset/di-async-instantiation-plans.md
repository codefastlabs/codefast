---
"@codefast/di": minor
---

perf(di): compile statically-visible graphs entering resolveAsync into async plans

A transient `class`/`resolved`/`resolved-async` binding resolved by `resolveAsync` at a true root (no open cascade) now
compiles once into a plan, like the sync lane has always done — the graph is declared up front, so nothing about it
needs per-level bookkeeping. A fully synchronous subtree executes without touching a promise; nodes that may yield one
await their dependencies together, exactly as the interpreted path does (promise-valued constants unwrap, siblings start
before the first rejection propagates). `dynamic-async` factories stay opaque and keep the cascade lane. Escapes replay
the async dispatch seeded with the plan's ancestors, so cycles, criteria and hooks behave as if nothing had compiled.
Diagnostics gain `compiledAsyncPlanCount`.
