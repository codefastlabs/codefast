Measured at `dbae5d4cc` — the previous baseline's tree plus three engine changes: `validate` reading a container's
internals built once (#1109), `@inject` accessors compiled into their class's plan (#1110), and a memoized root
collection handed out instead of copied (#1111) — from a `dist` built first. 2m19s wall.

**What moved since the previous pass (`2026-10-18T02-02-01-347Z`, at `7d7060a19`).** The rows those changes aim at, and
nothing else. Per row, every competitor reads within 1.1% of the previous pass's median, 0.995× to 1.011×, and
codefast's own median row reads 0.998×.

- `accessor-injection-construct` +28%, in line with #1110's paired run (1.26×).
- `realistic-graph-validate` +23%, in line with #1109's paired run (1.17×).
- The three stable-set rows, above the throughput ceiling: `resolve-all-strategies-10` +45%,
  `resolve-all-strategies-100` +61% and `production-event-bus-dispatch` +30%, in line with #1111's paired run (1.22×,
  1.67×, 1.32×). All three now lead ditox and injection-js, so the page drops their loss note.

The harness flags three rows at −8% to −10% — `dynamic-async-chain-8`, `unbind-all-100-singletons`,
`generate-dependency-graph` — and `fresh-child-name-n1` at +9%. The three are pass noise: a paired alternating
`bench:ab` of the previous pass's tree (`7d7060a19`) against this one, four full-profile experiments in both orders,
reads them at 1.02×, 0.98× and 0.995×, each flipping sign between experiments, with per-side spreads of ±5% to ±15% and
two canaries at 1.00× and 0.99×.
