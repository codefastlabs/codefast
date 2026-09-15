---
"@codefast/di": patch
---

Answer a request the slot indexes decline with an allocation-free first pass over the token's candidates: one slot match
with no predicate is returned outright and no match is a clean miss, without building a constraint context, a display
name or a candidate array. A second match, or a predicate on a match, still goes through full selection, so specificity
and ambiguity are decided exactly as before.
