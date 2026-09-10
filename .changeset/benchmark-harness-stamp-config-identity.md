---
"@codefast/benchmark-harness": minor
---

Stamp each `observations.jsonl` row with the run's configuration identity — `isolated`, `mode`, and `trialCount` — so a
reader can tell which execution shape and timing profile produced a measurement rather than plotting incomparable runs
on one series. The fields are required — a run directory written before this change no longer parses and is dropped from
the history rather than plotted without a configuration. `resolveRunShapeFromEnvironment` is the one resolver the JSONL
writer and the comparison `run` block now share, so the two cannot disagree on the configuration a run recorded.
