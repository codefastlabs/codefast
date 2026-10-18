---
"@benchmark/di": patch
---

`RESULTS.md` is regenerated from a pass over the tree after the API pass (async accessor plans, typed error codes, the
`Binder` and `@injectable()` type fixes, one module factory, `injectOptional`). Every library reads about 1% slower than
the previous pass, codefast included, and paired runs of the two trees read every flagged row level. `app-boot-40` reads
0.94× ditox where it read 0.99×, with codefast's own row unchanged, so it joins the registration note's losses.
