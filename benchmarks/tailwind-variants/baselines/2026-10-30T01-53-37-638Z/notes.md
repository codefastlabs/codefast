Measured at `86bf84172` — `@codefast/tailwind-variants` 0.10.0 plus the unreleased change that takes the merge engine
from the application, from a `dist` built first, against `tailwind-variants` 4.0.0. The full profile in isolation, on a
machine whose 1-minute load average read under 2 on 14 cores for the whole pass.

**What moved since the previous pass.** The suite did, not the package. Every loop now hands each call a fresh props
object, as React does, so every row pays that allocation on both sides and the cached ratios read lower than before for
that reason alone. Three groups price the calls a component library makes on every render — `cn`, `override`,
`slot-class` — and `three-renders-*` joins the definition rows to reach codefast's second-call compile. The new groups
turn up two losses the old suite could not see: a slot called with props, and `cn` against the engine
`tailwind-variants` ships; the loss notes below say why each exists.

The harness flags four cells with a per-trial IQR above 5% — `uncached-slots-with-merge`, `uncached-slots-without-merge`
and both sides of `three-renders-slots` — and two rows above the throughput ceiling, `define-only-slots` and
`cn-with-merge`, where `tailwind-variants`' side runs above it. None of the flagged cells is in an aggregate except
`cn-with-merge`, which the aggregates carry and no reader should cite alone.
