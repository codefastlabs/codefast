Measured at `800897977` plus the rows that price merges no cache can answer — `@codefast/tailwind-variants` 0.10.0 with
its unreleased changes, from a `dist` built first, against `tailwind-variants` 4.0.0. The full profile in isolation. Two
processes outside the bench held a core each for the whole pass, and the 1-minute load average read 2.7 on 14 cores as
the subject's child started, above the under-2 this page usually asks for; read single cells with that in mind and the
aggregates as usual.

**What moved since the previous pass.** Three engine changes landed, each with a paired A/B against `main` in its pull
request. The selection store holds a thousand entries a generation and the encoder no longer runs out of keys or
switches the cache off, which the new `data-cells` and `wide-slots` rows price — both workloads lost before and win now.
`cn` answers a repeated pair of strings from a memo keyed on the strings as passed and joins in one pass, which took
`cn-with-merge` past `cva` and halved the gap to `tailwind-variants`. Variant values compile the first time a call
selects them, which moved the two- and three-render slot rows up by about half. The run diff reports the extreme-slots
rows as its improvements beyond noise and no regression.

**New rows.** `two-renders-*` end on the second-call compile. `data-cells` draws about a thousand distinct calls from
row and column data; `wide-slots` has enough compound-tested variants that the previous encoder overflowed its key and
cached nothing. `unique-class` and `first-render-cold-*` hand every merge a string no cache has seen, so they price the
merge engine itself — `tailwind-variants`' own engine beats `tailwind-merge` there, which the loss notes name as the
cost of leaving the engine to the application.

The harness flags per-trial IQR above 5% on the uncached slot controls, the first-render, two-render and three-render
slot rows, both cold first-render rows and `unique-class-with-merge` against `tailwind-variants`; three rows run above
the throughput ceiling — `define-only-slots`, and `cn-with-merge` on both competitors' sides. Of those, only
`cn-with-merge` and `unique-class-with-merge` sit in an aggregate, and no reader should cite either alone.
