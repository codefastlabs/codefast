---
"@codefast/di": patch
---

perf(di): settle a single-tag dependency at compile time, the named settlement's rule on the tagged lane

A compiled plan settled a name-only dependency ahead of time and still escaped a tag-only one, though the tagged lane
now has everything the named rule needs: criteria are interned so an index hit is exact, and the chain-walk memo gives
the compiler a path-independent lookup to ask. A dependency carrying one tag and nothing else, whose candidate carries
no predicate and whose slot the request satisfies, now compiles to a plain dep thunk; a predicate, a second tag, a name,
a miss — anything whose selection could read the resolution path — escapes exactly as before, on both the sync and async
plan lanes.

`InstantiationPlanHost` gains `lookupPathIndependentTaggedEntry`, deliberately **optional** where the named twin's
arrival was a breaking change: a host that does not provide it stays a valid host, and a compiler given none simply
escapes the dependency, which is the pre-settlement behavior.

Measured paired against the previous build, six alternating passes: the new `slot-injected-tag-compiled` row — four
tagged constants injected into one class, mirroring the named pair — reads **4.33×** (every pass 4.13–4.61), going 5.76M
→ 24.96M hz/op and landing exactly where `slot-injected-name-compiled` and the criteria-free `plan-deps-inlined` sit,
which is what "the criterion was the only reason it escaped" predicts. The interpreted twin and three controls hold
parity. Eight tests mirror the named settlement's pins — the baked answer tracks rebinds, a predicate keeps runtime
selection, an opaque factory's escape replays the tag — plus one holding a two-tag dependency on the runtime path.
