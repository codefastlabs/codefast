---
"@codefast/tailwind-variants": minor
---

**Breaking:** a slot call that passes both `class` and `className` now uses `className` alone, as a resolver call and a
compound entry already did; it used to append both, `className` then `class`, so `class` won a conflict. One rule now
covers every place a class prop appears: `className` when it is given, `class` otherwise.
