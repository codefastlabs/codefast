---
"@codefast/tailwind-variants": patch
---

The call that compiles a resolver's plan — the third for a component without slots, the second for one with them —
compiles only the variant values that call selects, plus each group's default, instead of every value the configuration
declares; the rest compile the first time a call selects them. A component rendered only a few times pays far less, and
a group nobody selects from costs nothing.
