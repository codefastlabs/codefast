---
"@codefast/tailwind-variants": minor
---

**Breaking:** a resolver or slot whose resolution has no classes now returns `""`, as upstream `tailwind-variants` does,
instead of `undefined`.
