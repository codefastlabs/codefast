---
"@codefast/tailwind-variants": patch
---

A resolver's second call compiles only the variant values a call selects, plus each group's default, instead of every
value the configuration declares; the rest compile the first time a call selects them. A slot component rendered two or
three times pays far less, and a group nobody selects from costs nothing.
