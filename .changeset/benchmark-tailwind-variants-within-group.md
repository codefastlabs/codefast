---
"@benchmark/tailwind-variants": minor
---

Declare each with-merge scenario's without-merge baseline (`comparesWithin`) and expose the mapping as
`SCENARIO_BASELINES`, so the report now carries a "Within-group cost" section: the throughput of every feature with
`tailwind-merge` relative to the same feature without it, per library. This makes the cost of `tailwind-merge` legible
directly — near-free on `@codefast/tailwind-variants`, a double-digit tax elsewhere.
