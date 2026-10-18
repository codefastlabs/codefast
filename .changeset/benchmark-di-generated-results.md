---
"@benchmark/di": minor
---

`RESULTS.md` is generated: `pnpm bench:results` builds it from the run under `baselines/` and the analysis notes in
`src/harness/results/notes.ts`, which carry no figures, and `pnpm bench:results:check` gates CI on the committed page
matching. A baseline now keeps `footprint.json` (written by `pnpm bench:footprint --save`) and a `notes.md` for the pass
beside its observations. The baseline moves to a pass over the release tree: every competitor reads level with the
previous pass, and the six rows the harness flagged read level in a paired A/B.
