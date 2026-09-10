---
"@codefast/benchmark-viewer": minor
---

Serve a run's `report.md` and `report.json` for download, derived on demand from its `observations.jsonl`. A suite opts
in by passing `deriveReport` to `startBenchServer`; the server then answers `/api/report.md` and `/api/report.json`
(with a `run` id, or the newest run by default) as attachments, and the viewer shows Download links for the newest run
in the current filter. Payloads carry `reportsAvailable` so the links appear only when the server can derive them.
