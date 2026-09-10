---
"@codefast/benchmark-viewer": patch
---

Stop exporting `WithinGroupCostEntry` — it is only used within `use-derived-payload.ts`, so the export was flagged as
unused. No behaviour change.
