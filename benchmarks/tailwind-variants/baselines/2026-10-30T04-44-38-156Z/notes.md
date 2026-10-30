Measured at `e62f2cb80`, which makes `cn` the default merge engine — `@codefast/tailwind-variants` 0.10.0 with its
unreleased changes, from a `dist` built first, against `tailwind-variants` 4.0.0. The full profile in isolation. Two
processes outside the bench held a core each for the whole pass, and the 1-minute load average read 3.4 on 14 cores as
the subject's child started, above the under-2 this page usually asks for; read single cells with that in mind and the
aggregates as usual.

**What moved since the previous pass.** The package merges with `cn` instead of `tailwind-merge` and exports `cn`'s own
`cn`. Every row whose merge meets a string no cache has seen moved: the run diff reports `unique-class-with-merge` as
its largest improvement beyond noise, from a loss to near parity with `tailwind-variants` and well ahead of `cva`; the
cold first-render rows went from losses to wins; `cn-with-merge` reaches parity with `tailwind-variants` and leads `cva`
further. A paired A/B against `main` before this pass read those rows the same way and every cached row within noise. No
regression beyond noise.

The harness flags per-trial IQR above 5% on the uncached controls, the first-render, cold first-render, two-render and
three-render rows, and `unique-class-with-merge`; three rows run above the throughput ceiling — `define-only-slots`, and
`cn-with-merge` on both competitors' sides. Of those, only `cn-with-merge` and `unique-class-with-merge` sit in an
aggregate, and no reader should cite either alone.
