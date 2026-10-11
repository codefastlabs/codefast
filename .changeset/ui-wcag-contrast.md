---
"@codefast/ui": minor
---

Every palette now meets WCAG 2.2 AA contrast in both color schemes. `primary` moves to the step whose label and
`text-primary` links clear 4.5:1; `primary-foreground` turns dark on the bright dark-scheme `primary`; `ring` moves to a
step that clears 3:1 against every surface, and the sidebar tokens follow. Focus is drawn as a solid 2px `ring` outline
offset 2px
(`focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring`)
instead of a `ring` border with a 50% halo, so it keeps its contrast and survives forced-colors mode; the destructive
Button and Badge draw it in `destructive`. The base `outline-color` every element inherits is `ring` at full strength.
The default Button, Badge link and Bubble hover with the new `bg-primary-hover`, which pulls `primary` toward
`foreground` instead of fading it, so the label gains contrast on hover.
