---
"@benchmark/di": minor
---

Add `bench:report [run]`, which derives `report.md` and `report.json` for a run from its `observations.jsonl` on demand
— defaulting to the newest run, or taking a run id or path. The comparison assembly (pivot, competitor order, display
and short names, presentation) is extracted into `src/harness/comparison.ts` so the live run and the derived report
build the identical comparison from one source.
