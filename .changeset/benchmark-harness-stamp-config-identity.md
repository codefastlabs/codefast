---
"@codefast/benchmark-harness": minor
---

Stamp each `observations.jsonl` row with the run's configuration identity — `isolated`, `mode`, and `trialCount` — so a
reader can tell which execution shape and timing profile produced a measurement rather than plotting incomparable runs
on one series. The fields are optional, so a row written before this change still parses.
`resolveRunShapeFromEnvironment` is the one resolver the JSONL writer and the comparison `run` block now share, so the
two cannot disagree on the configuration a run recorded.
