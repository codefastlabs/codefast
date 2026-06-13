---
"@codefast/ui": patch
---

style(controls): differentiate motion tokens by role across form controls

Apply the design system's motion curves consistently: containers/rings use `ease-snappy`, while the moving/appearing indicators use `ease-spring`.

- Switch thumb now eases with `ease-spring` (the positional slide); the track keeps `ease-snappy`.
- Checkbox, CheckboxCards and CheckboxGroup indicators spring-scale in (`animate-in zoom-in-50 ease-spring`) instead of appearing instantly.
- RadioGroup and RadioCards dots spring-scale in, centering preserved.
- Slider thumb's color/box-shadow (focus ring) transition picks up `ease-snappy`.
