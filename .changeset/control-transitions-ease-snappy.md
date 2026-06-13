---
"@codefast/ui": patch
---

style(switch, checkbox): apply the ease-snappy motion token to control transitions

Switch (track + thumb slide) and the Checkbox family previously used bare `transition-*` utilities, falling back to Tailwind's hardcoded default curve. They now use the design system's `--ease-snappy` token so the timing stays consistent with the rest of the motion system and follows future theme retunes.
