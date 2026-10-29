---
"@codefast/ui": patch
---

`destructive` text now clears 4.5:1 on its own tint in every palette. The destructive Button, Badge, Bubble and menu
items draw `text-destructive` over a tint of the same color, and that tint pulls the fill toward the text: in light it
measured 3.8–4.0:1 at rest and 3.1–3.3:1 hovered in all 22 palettes; in dark it held at rest on `background` but fell to
3.9:1 on `neutral`'s popover and 4.5:1 on `stone`'s card and popover, and to 3.3–4.5:1 hovered everywhere. Light
`destructive` moves from `red-600` to `red-700` and dark from `red-400` to `red-300`, in all 22 palettes, and the hover
tint of the destructive Button, Badge link and Bubble eases from 20% to 15% in light and from 30% to 25% in dark — a 30%
hover cannot reach 4.5:1 in dark with any red that still reads as red. A custom theme that sets its own `--destructive`
should check it the same way: `tests/unit/css/themes.test.ts` holds `destructive` to 4.5:1 as plain text and on each
tint, over `background`, `card` and `popover`, in both schemes.
