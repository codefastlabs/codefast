---
"@internal/benchmark-harness": minor
---

Add the primitives a suite needs to derive a report from a run's `observations.jsonl` instead of reading eagerly written
artifacts: `parseRunObservations` recovers each library's payloads and the run's shape from the file,
`resolveRunDirectory`/`readRunObservations` locate and read a run (an explicit path, a run id, `latest`, or the newest),
and `runOrderForShape` reconstructs the run-order caveat from the stamped `isolated` flag. `buildComparisonDocument` now
accepts the run `shape` as input, falling back to the environment only for a live run, so a report derived from disk
records the configuration the run actually used rather than the shell's.
