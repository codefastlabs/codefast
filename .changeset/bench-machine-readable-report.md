---
"@codefast/benchmark-harness": minor
---

Write the comparison as `report.json`, and add `bench:list` for scenario ids.

A run produced two artifacts: `observations.jsonl`, which is raw per-trial data and already ideal for a machine, and
`report.md`, which holds every conclusion. The conclusions existed nowhere else — `buildComparisonRows` and
`summarizeComparison` return full objects with ratios, win/parity/loss classification, per-group geomeans and
reliability verdicts, and the run handed them to a renderer and dropped them. Reading a ratio back therefore meant
parsing a fixed-width markdown table whose figures are rounded to three significant figures, with `†`/`‡` glyphs
encoding thresholds only the renderer knows — lossy enough that a few-percent move is not recoverable.

`buildComparisonDocument` serialises what was already computed. `report.json` (mirrored to `latest.json`) carries the
environment, each library at its measured version, every row at full precision with the reliability verdicts resolved to
booleans, and the head-to-head summaries. It carries a `schemaVersion`, because run directories are kept for historical
comparison and a silently reinterpreted field is the failure that guards against. Two of these files are a plain dict
join, so "did this row move between runs" no longer requires reimplementing the aggregate layer.

`pnpm bench:list` prints the scenario ids as JSON on stdout, with the libraries implementing each row. Asking a suite
what rows it has previously meant driving the `BENCH_LIST` protocol key against a child entry by hand and regexing the
framed payload out of its stdout. The parent's progress logging moves to stderr so stdout carries the document alone —
no framing markers, no last-line heuristic.

`discoverBenchScenarioIds` replaces the discovery spawn both isolated runners had inlined, and
`buildBenchRunOutputPaths`/`writeBenchRunArtifacts` replace the run-directory layout and the six write calls each suite
had its own copy of.
