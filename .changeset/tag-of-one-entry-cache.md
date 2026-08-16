---
"@codefast/di": patch
---

perf(di): a one-entry cache in front of `TagKey.of()`, narrowing the inline-criterion gap

The tag-interning changeset recorded that an inline `.of(v)` stayed behind a hoisted criterion because every call reads
the intern map, and that the gap had widened rather than closed. An inline call site usually repeats one value, so
`of()` now keeps its last `(value, pair)` and answers a repeat before touching `internKeyFor` or the map. The check is
`Object.is` — the comparison the slot contract already defines — so ±0 stay distinct and `NaN` hits itself, with no
special-casing.

Measured paired against the previous build, six alternating passes on rows whose A/A floor is the suite's widest:
`slot-tag-shorthand-inline` **1.07×** (six of six passes positive, 1.040–1.124) and `slot-tag-array-inline` **1.07×**
(five of six), while both hoisted rows — which never call `.of()` in the loop — sit at parity, doubling as the proof the
source swap was live. Hoisted stays the fast spelling, as it must: it pays zero calls.
