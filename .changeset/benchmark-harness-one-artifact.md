---
"@codefast/benchmark-harness": minor
---

Persist one file per run. `writeBenchRunArtifacts` now writes only `observations.jsonl` into the run directory and, for
a whole-suite run, points `bench-results/latest.json` at it with a one-line `{ runId }` — the three-file `latest.*`
mirror and the eagerly written `report.md`/`report.json` are gone, since both are pure derivations of the observations
and are rebuilt on demand by `bench:report` and the viewer's report download. `WriteBenchRunArtifactsParameters` drops
`markdown`, and `BenchRunOutputPaths` now carries `jsonlPath` and `latestPointerPath` in place of the report and mirror
paths.
