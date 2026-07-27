---
"@codefast/benchmark-harness": minor
---

Reshape the comparison report so it stays readable as competitors are added. The per-scenario table now carries the pivot's throughput and one ratio column per competitor — the per-competitor throughput, latency and IQR columns were all derivable from those or from the JSONL, and they grew the table by two columns per library. The head-to-head prose that opened the report is now a **Summary** table with one row per competitor (comparable rows out of the suite, win/parity/loss, median, geomean, unreliable-row count) and a **Geomean by group** matrix, both of which grow downward rather than sideways.

The IQR column becomes a `‡` cell marker driven by the same ~5% threshold the reports already told readers to apply, alongside the existing `†` marker for ratios that do not reproduce between runs. The "Biggest wins" line is gone: it cherry-picked exactly the high-throughput rows `†` exists to warn against citing.

`markRatioReliability` is replaced by `markRatioQuality` / `markThroughputQuality`, which take a `ThroughputQuality` per side so a cell's markers and the footnote counts cannot disagree. `formatLatencyMeanMilliseconds` and `formatIqrThroughputFraction` are removed with the columns they served; ratio formatting is unified on `formatRatioMultiple`.
