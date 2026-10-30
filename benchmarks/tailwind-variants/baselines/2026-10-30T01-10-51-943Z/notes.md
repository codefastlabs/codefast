Measured at `3f8521ba1` — `@codefast/tailwind-variants` 0.10.0, whose `src` is unchanged since that release, from a
`dist` built first, against `tailwind-variants` 4.0.0. 14.5s wall, the full profile in isolation, on a machine whose
1-minute load average read about 3 on 14 cores as the pass started.

**What moved since the previous pass.** The competitor did. `tailwind-variants` moved from 3.3.1 to 4.0.0, which renders
markedly faster on every cached row, so codefast's lead over it narrowed in every group while every row still wins; it
narrowed most where 3.3.1 was slowest, the `compound-slots` and `extreme` groups. Codefast's own throughput holds: the
run diff finds no regression beyond noise and one improvement, `extreme-slots-with-merge`, a single row not yet
re-measured paired. Against `cva`, whose version did not change, the aggregates hold. The 4.0.0 bundle is larger than
3.3.1's, so codefast now ships the smaller of the two `tv()` libraries.

The harness flags three cells with a per-trial IQR above 5% — `uncached-slots-with-merge`,
`uncached-slots-without-merge` and the `tailwind-variants` side of `first-render-slots` — and one row above the
throughput ceiling, `define-only-slots`. None of them is in an aggregate: the `uncached-*` rows are codefast-only
controls, and the definition rows are declared incomparable.
