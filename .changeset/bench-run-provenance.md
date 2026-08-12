---
"@codefast/benchmark-harness": minor
---

Record how a run was invoked, and stop a narrowed run from becoming `latest.*`.

`latest.*` is a mirror of the newest run, and it carried nothing about how that run was produced. A run filtered to one
row overwrote it and was indistinguishable from a whole suite except by counting rows — which only helps a reader who
already knows how many rows the suite has. Since `latest.*` is what CI diffs and what a published figure is checked
against, a smoke or narrowed pass could quietly become the suite's published state.

`report.json` now opens with a `run` block: `runId`, `mode`, `isolated`, `scenarioFilter`, `trialCount`, and
`scenariosMeasured` against `scenariosAvailable`. A filtered run writes its own directory and does not mirror, saying so
on stdout. A smoke run still mirrors, because `run.mode` is enough to tell it apart from a publishable one. `runOrder`
moves inside the block, and both it and `scenarioFilter` are explicit `null` rather than absent — `JSON.stringify` drops
an undefined property, and a reader cannot tell a key meaning "no filter" from one the writer forgot.

The run directory's basename becomes `runId` and is stamped once by the parent, so a `latest.*` mirror joins back to its
directory exactly. It previously had to be matched by nearest timestamp, because the name came from the parent while the
document's own timestamp came from a child a second or so earlier.

A child now reports every scenario id it collected rather than only in discovery mode, which is what lets the parent
know the suite's full row count in every profile. `schemaVersion` is 2.
