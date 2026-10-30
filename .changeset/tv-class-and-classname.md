---
"@codefast/tailwind-variants": minor
---

**Breaking:** a call that passes both `class` and `className` now gets both, `class` first, the way upstream
`tailwind-variants` applies them; a component without slots used to keep only `className` (and drop `class` behind an
empty `className`), and a slot appended them in the opposite order. A compound variant or compound slot that declares
both likewise applies both, joined per slot for a slot map, instead of only its `className`.
