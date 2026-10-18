---
"@internal/design-system": minor
---

`tokens.json` carries Tailwind v4's whole default theme beside the components' own tokens: the full palette, every
spacing multiple, the text-size scale as `type-*` styles, every shadow, breakpoints, container widths, font weights,
tracking, leading, blur, perspective and the easing and animation presets. The brand book says what each family is for,
and the build fails when two families mint the same token name.
