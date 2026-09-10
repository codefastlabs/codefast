---
"@codefast/benchmark-viewer": patch
---

Let the page use the full viewport width. The layout dropped its centered `max-w-7xl` container (and the header's
`max-w-4xl` cap), so on a wide screen the chart spans the whole width and the control panel fits every filter on one row
instead of wrapping. Reading widths stay bounded where they matter — the intro copy keeps its `max-w-prose`.
