---
"@internal/benchmark-harness": minor
---

`latest.json` keeps one pointer per run configuration — shape, profile and trial count — mapping each configuration key
to `{ runId }` of its newest whole-suite run. A run moves only its own configuration's pointer, and the diff reads the
pointer for the current run's configuration, so a `bench:baseline` or `bench:fast` pass no longer leaves the next plain
`bench` with `No diff … it ran isolated · full`. A configuration with no pointer yet shows no diff rather than falling
back to the newest directory, which could be a narrowed run. `readPreviousRun` takes the current configuration,
`resolveLatestRunDirectory` resolves one configuration's run, and `benchConfigKeyOfRow`/`benchConfigLabelOfRow` are
`benchConfigKey`/`benchConfigLabel`, taking any `BenchRunConfiguration`. A single-run `latest.json` from before reads as
no pointer and is replaced by the first whole-suite run of each configuration.
