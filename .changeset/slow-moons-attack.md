---
"@internal/benchmark-harness": minor
"@benchmark/di": patch
"@benchmark/tailwind-variants": patch
---

Show measuring time per library in the progress block instead of wall-clock elapsed.

An isolated run is scenario-major, so every library's clock started at its discovery child and stopped when the whole
run ended — all seven rows printed the same span no matter how many scenarios they measured. `ProgressTracker` now
accumulates `busyMs` across a library's measuring subprocesses and the frame renders that, so the column says what each
row actually cost the machine. Wall-clock still appears once, in the run card. The live display also stops redrawing a
row that sits idle between subprocesses, and the plain lane closes a library with
`all N scenario(s) measured in <time>`.
