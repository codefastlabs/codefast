Measured at `654d02f15` — `@codefast/tailwind-variants` 0.10.0 with its unreleased changes, from a `dist` built first,
against `tailwind-variants` 4.0.0. The full profile in isolation, on a machine whose 1-minute load average read 1.7 on
14 cores as the subject's child started.

**What moved since the previous pass.** Four engine changes landed, each with a paired A/B against `main` in its pull
request. A component without slots keys its store by the selection alone and remembers a caller's class inside it from
the class's second sighting; it settles on reusing its merged answer only once it has met several classes; an explicit
default shares the omitted variant's entry; and it compiles its plan on the third call rather than the second. The run
diff reports ten rows improved beyond noise and none regressed — `data-cells` and `override` most, then the repeated and
simple rows and `unique-class-with-merge`, which went from the one loss to a win.

**New and corrected rows.** `first-page-cold-*` render each cold definition the way one page shows it, and
`two-renders-wide` defines a component with many defaulted variants. The cold rows' per-definition class used to be one
the button's default size overrode, so every definition merged to the same answer and `tailwind-variants` answered from
its cache; the class is now one nothing overrides.

The harness flags per-trial IQR above 5% on the uncached controls, the cold first-render and first-page rows, the two-
and three-render slot rows and `unique-class-with-merge`; three rows run above the throughput ceiling —
`define-only-slots`, and `cn-with-merge` on both competitors' sides. Of those, only `cn-with-merge` and
`unique-class-with-merge` sit in an aggregate, and no reader should cite either alone.
