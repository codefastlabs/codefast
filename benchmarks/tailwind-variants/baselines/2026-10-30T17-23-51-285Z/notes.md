Measured at `e6e97d52d` — `@codefast/tailwind-variants` 0.10.0 with its unreleased changes, from a `dist` built first,
against `tailwind-variants` 4.0.0. The full profile in isolation, on a machine whose 1-minute load average read 1.3 on
14 cores as the subject's child started.

**What moved since the previous pass.** `className` now wins over `class` on every call, slot call and compound entry,
so a call forwarding `className` never reads `class`; applying both had cost `override-with-merge` a few percent in a
paired A/B. A slot call also answers an absent class prop without allocating. Paired A/Bs against the release before the
parity fixes read `override`, `simple`, `slot-class` and the slot rows at parity or better.

**Read against the previous pass.** The run diff improves no row beyond noise and flags one regression,
`data-cells-with-merge`. A paired A/B against `main` reads that row faster, and one against the release before the
parity fixes reads it a little slower inside a wide per-trial spread; its hit path runs the same code as that release,
so the gap has no cause in the source yet.

The harness flags per-trial IQR above 5% on the uncached controls, `first-render-slots`, the cold first-render and
first-page rows, the two- and three-render slot rows and `unique-class-with-merge`; four rows run above the throughput
ceiling — `define-only-simple`, `define-only-slots`, and `cn-with-merge` on both competitors' sides. Of those, only
`cn-with-merge` and `unique-class-with-merge` sit in an aggregate, and no reader should cite either alone.
