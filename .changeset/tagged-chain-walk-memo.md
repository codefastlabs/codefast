---
"@codefast/di": patch
---

perf(di): memoize the single-tag chain walk, with a deferred map so a per-request child does not pay for it

A single-tag `resolve` was the one criteria lane that consulted each container's tag index on the way up on **every**
call — `defaultEntry` and `namedEntry` already memoized their walks, and ARCHITECTURE carried the question as open,
waiting on a fresh-vs-warm measurement. That measurement (RESULTS.md, 2026-08-16): the memoized name lane answered the
same parent-owned shape at ~2.1× the unmemoized tag lane, warm; the memo's per-container state cost ~5–8% at duty cycle
1 and amortized before N=4.

`BindingLookupCache` gains `taggedEntry(token, tag)` — chain-versioned like `namedEntry`, `null` meaning "this shape
needs full selection", predicate- and alias-carrying hits declined so a `when()` is still evaluated on every resolve —
and `resolve()` gains the tagged twin of its name-only fast lane, dispatching just the shapes whose semantics involve no
resolution context (plain constants, cached singletons). The memo key is the criterion object itself: interning makes
identity the slot contract's own `Object.is`, so ±0 stay split and no indexed hit needs a value re-check.

The first cut mirrored `namedEntry` exactly and failed its own gate: `fresh-child-tag-n1` — one tagged resolve inside a
child that then dies — read 0.861 across six negative passes, and the whole cost was the inner-map allocation on a
container that never asks twice. So the first `(token, tag)` shape a cache generation sees is answered from the walk and
parked in a one-entry front; the map is not written until a second distinct shape appears, and an alternating pair
converges after one extra walk per key.

Measured paired against the previous build, six alternating passes, medians: `slot-tag-parent-owned` **2.78×** (every
pass 2.73–2.95), `slot-tag-shorthand-hoisted` **2.14×**, `tagged-binding-resolve` **1.98×** (a head-to-head row),
`fresh-child-tag-n4` **1.24×**, with the must-hold `fresh-child-tag-n1` at 0.98 (0.933–1.072, inside that row's floor)
and the name-lane and multi-tag controls at parity. Seven new tests pin the memo's invalidation and its refusals:
rebind/unbind in both request spellings, a parent rebind observed from a child, a predicate beside the tag, a late
container-level activation hook, and a warmed `+0` criterion refusing `-0`.
