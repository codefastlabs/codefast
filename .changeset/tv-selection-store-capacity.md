---
"@codefast/tailwind-variants": patch
---

A resolver keeps answering from its cache where it used to stop: a compound-tested variant no longer runs out of keys
however many distinct values callers pass, a configuration whose selection space is past one safe integer is still
cached, and the store holds enough selections for a component whose variants and `className` come from data.
