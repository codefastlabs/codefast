Measured at `0c72aea45` plus the change that answers a class-only slot call from the slot's memo —
`@codefast/tailwind-variants` 0.10.0 with its unreleased changes, from a `dist` built first, against `tailwind-variants`
4.0.0. The full profile in isolation, on a machine whose 1-minute load average read under 2 on 14 cores for the whole
pass.

**What moved since the previous pass.** `slot-class-with-merge` went from a loss to a win. A slot called with props that
carry no variant override — usually only the `className` a sub-component was given, often absent — now reads the call's
shared text instead of re-resolving the slot, and returns the memoised answer when the caller's class is empty. The run
diff reports that row as its one improvement beyond noise and no regression; a paired A/B against `main` on the slot
rows that call without props reads within noise, its two experiments disagreeing in sign. `cn-with-merge` against `cva`
slipped from the edge of parity to just past it, on the same build of `cn`, so its note now names that side too.

The harness flags four cells with a per-trial IQR above 5% — `uncached-slots-with-merge`, `uncached-slots-without-merge`
and both sides of `three-renders-slots` — and two rows above the throughput ceiling, `define-only-slots` and
`cn-with-merge`, where `tailwind-variants`' side runs above it. None of the flagged cells is in an aggregate except
`cn-with-merge`, which the aggregates carry and no reader should cite alone.
