---
"@internal/design-system": patch
---

The design system describes `@codefast/ui` as it is today. The brand book and the token notes now give Card its
`--card-spacing` of `spacing-4` (`spacing-3` at `size="sm"`), Alert its `radius-lg` and `px-2.5` padding, Field its
`spacing-2` label gap and FieldGroup its `spacing-5` stack, and name the `foreground/10` ring that outlines Card, Dialog
and the floating menus. They add the preset's global reduced-motion rule and the base-layer focus outline, tell the
`shimmer` utility (2s) apart from Skeleton's `animate-shimmer` (2.2s), and keep `shadow-xs` to the `outline` Button and
Toggle. The focus ring is measured against every surface it is drawn on, as the brand book claims. `index.d.ts` now
carries every published hook the bundle exposes, read from `@codefast/ui`'s `exports`, and the `indicator` option is
listed under `ChartTooltipContent`, the part that takes it.
