---
"@codefast/ui": patch
---

Secondary text now meets WCAG 2.2 AA contrast in every palette. In the light scheme `muted-foreground` moves from the
500 step of the palette's neutral to its 600 step (`zinc-600`, or `gray-600`, `neutral-600`, `slate-600`, `stone-600`),
so descriptions, placeholders, table captions and `Kbd` clear 4.5:1 on `muted` as well as on `background`, `card` and
`popover`; the 500 step measured 4.3–4.5:1 on `muted`. The dark scheme already cleared it and is unchanged.
`tests/unit/css/themes.test.ts` now checks `muted-foreground` on all four surfaces in every palette and both schemes.
