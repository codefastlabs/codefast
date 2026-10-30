---
"@codefast/tailwind-variants": patch
---

A caller's class on a component without slots merges onto the selection's joined text, and the selection only settles on
reusing its shorter merged answer once it has met several classes, so the first class a selection meets costs one merge
and nothing more. A selection also stops remembering caller classes past a fixed count, which keeps a long-lived
selection's memory bounded.
