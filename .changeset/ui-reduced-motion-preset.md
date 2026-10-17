---
"@codefast/ui": patch
---

The preset now honours `prefers-reduced-motion` with one global rule: under `reduce`, every animation and transition,
including those on `::before` and `::after`, runs for a near-zero duration and plays once. Closed dialogs, popovers,
sheets and menus still unmount, because `animationend` and `transitionend` keep firing. The rule sits outside every
cascade layer, so it beats every utility, and a layered `!important` such as `motion-reduce:duration-200!` still opts
essential motion back in. This restores the reduced-motion coverage that most components had lost, and the per-component
`motion-reduce:` guards on `Spinner` and `InputNumber` and the `shimmer` utility's own reduced-motion block are gone,
since the global rule covers them.
