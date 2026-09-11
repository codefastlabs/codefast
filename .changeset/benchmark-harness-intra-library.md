---
"@internal/benchmark-harness": minor
---

Add the intra-library comparison axis. A scenario can declare `comparesWithin: "<baseline-scenario-id>"`, and
`buildIntraLibraryRows` computes, for every library, that scenario's throughput ratio to its baseline (with the same
reliability marker as a cross-library ratio). The comparison document gains an `intraLibrary` section and the markdown
report a "Within-group cost" table, both driven by a `baselineOf` map passed to `buildComparisonDocument` /
`renderComparisonMarkdownReport`. This surfaces within-library costs — such as the price of `tailwind-merge` per feature
— that the pivot-vs-competitors axis cannot express.
