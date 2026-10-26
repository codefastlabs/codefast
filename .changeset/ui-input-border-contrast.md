---
"@codefast/ui": minor
---

Form control borders now meet WCAG 2.2 AA non-text contrast (SC 1.4.11) in every palette. A new `control` token draws
the boundary of `Input`, `Textarea`, the `Select` and `NativeSelect` triggers, `InputGroup`, `InputNumber`, `InputOTP`,
`Checkbox`, `Radio` (and their group and card controls) and the unchecked `Switch` track, exposed as `border-control`,
`bg-control` and `inset-ring-control`. In the light scheme it keeps the palette's neutral hue and chroma at lightness
0.645, 3.1:1 or more on `background`, `card`, `popover` and `sidebar`, where `input` measured 1.2–1.3:1. In the dark
scheme it is white at 36%, 3.2:1 or more, where `input` measured 1.4–1.5:1.

`input` keeps its values and its quieter roles: dark field fills, the outline `Button` and `Toggle`, the `CheckboxCards`
and `RadioCards` borders, the `ButtonGroup` separator. A custom theme should declare `--control`; until it does,
`control` falls back to `input`.
