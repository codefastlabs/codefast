---
"@codefast/benchmark-viewer": minor
---

Surface the within-group cost in the viewer. A suite passes `scenarioBaselines` (each scenario id mapped to its
within-group baseline) to `startBenchServer`; when the selected scenario names a baseline, the viewer shows each
library's throughput relative to that baseline over the plotted runs — the same within-group ratio the report's
"Within-group cost" section carries, so the cost of a variant (such as enabling `tailwind-merge`) is legible on the
history page too.
