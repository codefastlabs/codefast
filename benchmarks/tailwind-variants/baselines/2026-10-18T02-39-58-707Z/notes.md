Measured at `ecff22f59` — `@codefast/tailwind-variants` 0.9.1, whose `src` is unchanged since that release, from a
`dist` built first. 15.5s wall, the full profile in isolation, on a machine whose 1-minute load average read under 3 on
14 cores for the whole pass.

**What moved since the previous pass.** Nothing to read against: this is the suite's first committed baseline, so there
is no previous pass and the run diff has no anchor. Every later `pnpm bench:baseline` pass is read against this one.

The harness flags four cells with a per-trial IQR above 5% — `uncached-slots-with-merge`, `uncached-slots-without-merge`
and both sides of `first-render-slots` — and one row above the throughput ceiling, `define-only-slots`. None of them is
in an aggregate: the `uncached-*` rows are codefast-only controls, and the definition rows are declared incomparable.
