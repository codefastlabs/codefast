---
"@internal/benchmark-harness": minor
---

Every trial runs the one closure built from a scenario before the first trial. A fresh closure per trial — a second
closure from the same function literal — turned off V8's function-context specialization for it, so the first trial read
the specialized code and the others did not, and the median of three was the unspecialized number: about a fifth lower
on the fastest rows, a third for the pivot. Both sides of every ratio read the same thing now, and the figure is the one
a call site in an application sees.
