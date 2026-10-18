Measured at `7d7060a19` — `@codefast/di` 0.13.0 plus every unreleased change up to the release: the introspection
functions, settled dependency slots, complete sync teardowns, auto-register registries as modules and `disposeAsync` —
from a `dist` built first. 2m17s wall.

**What moved since the previous pass (`2026-10-15T23-25-39-540Z`, at `a849136d8`).** Nothing the engine did. Per row,
every competitor reads within 1.5% of the previous pass's median, 0.986× to 1.006×, and codefast's own median row reads
0.999×. What landed in between is API and lifecycle work — slot names narrowed on a factory's context, every stage of a
sync teardown run before it reports an async hook, auto-register registries loaded as modules, `dispose` renamed
`disposeAsync` — and three refactors that move cold-path code out of the resolver to its owners: `validate`'s miss
check, a class's constructor params, and a collection memo's stable value list.

The harness flags six rows at −6% to −15% — `container-create-empty`, `resolve-optional-async-miss`,
`resolve-async-single-hop`, `realistic-graph-resolve-root`, `async-init-single-hop`, `fresh-child-name-n1` — and four at
+6% to +11%. All six are pass noise: a paired alternating `bench:ab` of the previous pass's tree (`a849136d8`) against
this one, four full-profile experiments in both orders, reads them at 0.96× to 1.05× with per-side spreads of ±7% to
±19%, and two canaries at 0.99× and 1.00×. `container-create-empty` is bimodal per process — both trees read 29.5M ops/s
in the first experiment and 25M in the other three, so the −15% is which mode the pass landed in.
`fresh-child-name-n1`'s 0.96× comes from the two experiments where the new tree ran second; run first, it read 0.99× and
1.00×.
