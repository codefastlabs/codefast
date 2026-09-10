---
"@codefast/benchmark-viewer": patch
---

Make the chart tooltip swatches show each series' true colour. Chart.js fills a tooltip's colour box with the dataset's
`backgroundColor`, which for a line is the near-transparent fill under the curve (alpha `0.08`), so the swatches read as
washed-out. A `labelColor` callback now paints each swatch with the line's solid, opaque colour instead.
