---
"@codefast/ui": minor
---

A new `control` token draws the boundary of `Input`, `Textarea`, the `Select` and `NativeSelect` triggers, `InputGroup`,
`InputNumber`, `InputOTP`, `Checkbox`, `Radio` (and their group and card controls) and the unchecked `Switch` track,
exposed as `border-control`, `bg-control` and `inset-ring-control`. By default it is the same hairline as `input`, so
the controls look as they did. When the viewer asks their system for more contrast (`prefers-contrast: more`), it rises
to WCAG 2.2 AA non-text contrast (SC 1.4.11) in every palette: the palette's neutral hue and chroma at lightness 0.645
in light, 3.1:1 or more on `background`, `card`, `popover` and `sidebar`, and white at 36% in dark, 3.2:1 or more.

`input` keeps its quieter roles: dark field fills, the outline `Button` and `Toggle`, the `CheckboxCards` and
`RadioCards` borders, the `ButtonGroup` separator. A custom theme should declare `--control`, and its own
`prefers-contrast: more` value if it wants one; until it does, `control` falls back to `input`.

pr: #1158
