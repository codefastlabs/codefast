---
"@internal/benchmark-harness": patch
"@internal/benchmark-viewer": patch
---

A bench scenario can declare a `revision`, bumped whenever the work one timed iteration does changes. The harness
records it with every observation, and the history viewer marks the run where it changed as "measurement changed", so a
step caused by the suite no longer reads as a library regression. Rows written before revisions existed read as the
first.
