---
"@internal/design-system": patch
---

The build failed once `@codefast/ui`'s palettes declared `success` and `warning`: every color token needs a usage note.
`control`, `success`, `success-foreground`, `warning` and `warning-foreground` have one, `input` describes its quieter
roles, the contrast check measures `success` and `warning` as text and on their own tints, and their foregrounds on
their fills, and the brand book and Palettes page name the new tokens.
