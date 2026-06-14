---
"@codefast/ui": patch
---

style(radio): spring the native radio dot, matching RadioGroup

The native `Radio` input drew its dot with a `::before` that doubled as the unchecked fill, so animating it made the dot shrink in — the opposite of the Radix-based RadioGroup/RadioCards dots, which scale up. Move the inner fill onto the input's own `bg-background`/`bg-input` so `::before` is purely the dot, then scale it `0 → 1` with `before:transition-transform before:ease-spring` on check. The dot now grows in with the same spring curve as the other radios; the static appearance is unchanged in light and dark.
