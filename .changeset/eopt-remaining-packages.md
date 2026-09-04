---
"@codefast/cli": patch
"@codefast/benchmark-viewer": patch
---

Enable `exactOptionalPropertyTypes` for the packages that were temporarily opted out when it became the `base.json`
default (`@codefast/cli`, `@codefast/tailwind-variants`, and the private benchmark packages). Only `@codefast/cli` and
`@codefast/benchmark-viewer` needed code: the optional fields the flag surfaces on their exported request/option/prop
types are widened to `?: T | undefined`. Backward-compatible type change — no runtime effect.
