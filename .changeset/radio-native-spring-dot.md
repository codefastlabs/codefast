---
"@codefast/ui": patch
---

style(radio): spring the native radio dot on toggle

The native `Radio` input draws its dot with a `::before` pseudo-element, so it can't use the `animate-in` keyframe the Radix-based RadioGroup/RadioCards use. Add `before:transition-all before:duration-150 before:ease-spring` so the dot eases with the same spring curve when toggled.
