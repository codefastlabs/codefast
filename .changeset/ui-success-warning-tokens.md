---
"@codefast/ui": minor
---

Every palette defines `success`, `success-foreground`, `warning` and `warning-foreground` in both schemes, exposed as
`bg-success`, `text-success-foreground`, `text-warning`, `border-warning` and the rest. Light mode uses a dark green and
amber with a `*-50` foreground, dark mode a light green and amber with a `*-950` foreground. `success` and `warning`
clear 4.5:1 as text on `background`, `card` and `popover`, and on their own tint over them at rest and hovered (`/10`
and `/15` light, `/20` and `/25` dark, the tints the destructive `Button`, `Badge` and `Bubble` use); each foreground
clears 4.5:1 on its solid fill. A custom theme should declare the four tokens too.
