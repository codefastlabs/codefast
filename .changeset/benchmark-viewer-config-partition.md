---
"@codefast/benchmark-viewer": minor
---

Partition the run history by configuration, the way it already partitions by environment. Each run carries a
`configKey`/`configLabel` derived from its execution shape, timing profile, and trial count, and the chart defaults to
the newest run's configuration so incomparable regimes — `isolated` vs `shared`, `fast` vs `full` — never share a line
until the reader widens to "All configs". A Configuration selector appears when the history holds more than one, and a
banner warns while "All configs" is showing more than one.
