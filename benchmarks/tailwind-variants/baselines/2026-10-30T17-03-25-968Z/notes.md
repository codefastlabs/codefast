Measured at `16ebdb4c0` — `@codefast/tailwind-variants` 0.10.0 with its unreleased changes, from a `dist` built first,
against `tailwind-variants` 4.0.0. The full profile in isolation, on a machine whose 1-minute load average read 1.6 on
14 cores as the subject's child started.

**What moved since the previous pass.** Resolution now matches `tailwind-variants` 4.0.0 wherever the two differed
without a recorded reason: an `extend` chain joins a redeclared value to its parent's, a variant value reads alike in
every lane, `class` and `className` both apply, a compound treats an absent, `null` and `false` value alike, and a
slot's own props reach its compound slots. The store counts an entry it promotes from its older generation toward the
limit, so a working set read again and again stays bounded. Every change carries a paired A/B against `main` in its pull
request, and none left a row slower beyond noise.

**Read against the previous pass.** The run diff improves no row beyond noise and flags one regression,
`compound-slots-without-merge`; a paired A/B of that row against `main` over six experiments reads parity, with `main`
itself measuring slower this session than at the previous pass, so the flag is drift between the two sessions rather
than the change. The `define-only-*` rows, which the paired A/B against `main` read faster, sit above the throughput
ceiling and carry no diff.

The harness flags per-trial IQR above 5% on the uncached controls, the cold first-render and first-page rows, the two-
and three-render slot rows and `unique-class-with-merge`; four rows run above the throughput ceiling —
`define-only-simple`, `define-only-slots`, and `cn-with-merge` on both competitors' sides. Of those, only
`cn-with-merge` and `unique-class-with-merge` sit in an aggregate, and no reader should cite either alone.
