---
"@codefast/cli": minor
---

`codefast audit runs` reports a benchmark suite's committed bench runs that break the `baselines/` vs `runs/` role
split: a `baselines/` holding anything other than the one run its `bench:baseline` script pins, a `runs/` directory no
tracked markdown document links to, a run directory holding anything other than a single `observations.jsonl`, and a
tracked `observations.jsonl` living outside either tree. `audit.runs.target` in `codefast.config` scopes which suite
roots it scans, defaulting to every direct child of `benchmarks/` that declares a `package.json`.
