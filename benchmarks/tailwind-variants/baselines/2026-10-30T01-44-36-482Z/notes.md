Measured at `65c130ba5` — `@codefast/tailwind-variants` 0.10.0 plus the unreleased change that takes the merge engine
from the application, from a `dist` built first, against `tailwind-variants` 4.0.0. 14.7s wall, the full profile in
isolation, on a machine whose 1-minute load average read under 3 on 14 cores as the pass started.

**What moved since the previous pass.** The bundle did, and the throughput did not. The package now imports only
`tailwind-merge`'s `twMerge`, and custom class groups arrive as a merge function the caller builds, so the smallest
program no longer carries `extendTailwindMerge` and the bundle row shrank. The run diff finds no regression and no
improvement beyond noise on any row, as expected: a cached render never reaches the merge, and the `uncached-*` rows now
pass an uncached `extendTailwindMerge` result as `twMerge`, the same work the configuration option asked for.

The harness flags four cells with a per-trial IQR above 5% — `uncached-slots-with-merge`, `uncached-slots-without-merge`
and both sides of `first-render-slots` — and one row above the throughput ceiling, `define-only-slots`. None of them is
in an aggregate: the `uncached-*` rows are codefast-only controls, and the definition rows are declared incomparable.
