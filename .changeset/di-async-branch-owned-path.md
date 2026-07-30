---
"@codefast/di": minor
---

Detect async cycles from the synchronous factory cascade instead of a settle-scoped path, and escape to a per-branch path only where the cascade cannot see.

A factory asks for its dependencies from its **synchronous prefix** — `async ctx => await ctx.resolveAsync(dep)` calls `resolveAsync` before it awaits anything — so an eight-level chain is built inside one synchronous cascade before any of it settles, and the chain of who-is-resolving-whom at the moment of a request is the call stack itself. While that cascade is open the resolver's own arrays are the ancestor chain, pushed on factory-enter and popped when the factory returns its promise rather than when that promise settles. Two cascades cannot interleave, so `binding.inFlight` is exact path membership for async too, exactly as it already was for sync. Every level shares one context; nothing is allocated per level and no level observes its own settlement.

This fixes a false `CircularDependencyError`. A diamond — `A` awaiting `B` and `C` in parallel, both needing `D` — rejected with `Circular dependency detected: a → b → d → c → d`, a path in which `b → d → c` is not a dependency edge at all. `D`'s flag is now clear by the time the second sibling asks for it.

A request made from a continuation, after an await, has its ancestors on no call stack. It arrives with the cascade empty — an exact test, since a continuation never runs inside one — and escapes to a branch lane whose path is append-only: a level appends while its branch still owns the next slot and copies its own prefix once a sibling has claimed it. Anything the cascade lane does not serve escapes the same way, seeded with a snapshot of the ancestors reached so far, and a subtree that has left the cascade stays off it. A cycle formed entirely from post-await edges is still reported, one level in from the true root, because the ancestors before the first escape were never written down; `resolver-async.test.ts` pins that message.

Measured with `BENCH_ISOLATE=1 BENCH_FULL=1`, libraries interleaved with rotating order, 3 trials: against inversify 8.2.3 the suite goes from **42 / 0 / 1** to **43 / 0 / 0** — the async chain row this library had always lost now reads **1.60×** where it read 0.75×, and the async group's geomean goes **1.13× to 1.58×**. Per-level overhead against a floor of eight plain awaited async functions falls from 48.3 ns to **19.5 ns** with the collector idle and **21.3 ns** with a full GC forced every 100 samples — the lane is now within ~7 ns of a build carrying no cycle bookkeeping at all, and it is GC-insensitive again.

A paired A/B of the two builds, five passes alternating which side ran first, holds all seventeen measured sync rows at parity (0.99–1.08× medians, no row negative across every pass), including `circular-dependency-3`, which shares the `binding.inFlight` flag the cascade now uses. That A/B is also what caught a regression the suite reported as a win: a materialized async singleton did not match the cascade lane and escaped, snapshotting both cascade arrays on every resolve, for **0.81×** of the previous build across all five passes. The cascade entry now answers a plain constant and a cached singleton itself.

`ARCHITECTURE.md` records the two shapes tried before this one, including the one that fixed the same bug and measured worse, and why the sync lane's compiled-plan answer does not port to async.

`ResolutionDiagnostics` no longer carries `asyncContextPoolSize`, since there is no async context pool to report.
