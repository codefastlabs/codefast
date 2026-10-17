---
"@internal/design-system": minor
---

Raise the Node.js floor to 24.15, the first Node 24 release jsdom runs on; jsdom declares
`^22.22.2 || ^24.15.0 || >=26.0.0`, so the earlier floor claimed Node 24.0–24.14, where the build's renderer refuses to
run.
