---
"@benchmark/di": minor
---

`RESULTS.md`, `results.json` and the bundle table are built by `@internal/benchmark-harness`'s shared generator; the
suite keeps only its notes and the copy that describes it, and both files regenerate byte for byte. Competitor names in
the notes are typed from the bench config, so a note can only quote a library the suite measures.
