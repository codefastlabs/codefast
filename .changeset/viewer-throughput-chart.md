---
"@internal/benchmark-viewer": patch
---

The throughput chart labels every tick of a log axis narrower than a decade, runs edge to edge so a zoomed window leaves
no gap on the right, and draws overlay rows at one width with filled markers for the selected row. Primary ratios plot
in their own chart under it, sharing its zoom and marking parity, and Download PNG captures both. The display toggles
name themselves by their visible text, the overlay toggle shows when a group has a single row, and tooltips list lines
highest first in both charts.
