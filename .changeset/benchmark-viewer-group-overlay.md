---
"@codefast/benchmark-viewer": minor
---

The chart can overlay every row of the selected scenario's group — one line per row and library, a colour family per
library with a shade, a dash pattern and a marker shape per row, the selected row at full weight while the others recede
with sparse markers — so the configurations of one workload read against each other on a single chart instead of one
chart per row. A legend table under the chart lists each row's newest value per library and its ratio to the selected
row; clicking a row selects it, its checkbox hides it, hovering it lifts its lines. Tooltips sort fastest first and
carry the same ratios. Bands and ratio lines stay off while the overlay is on, and a log axis labels only the 1, 2 and 5
of each decade. A `viewDefaults` server option lets a suite open with the overlay and the log axis already on.

Every run now reports in the newest run's `batch` unit, so a suite changing how many operations one timed iteration
performs no longer reads as a jump in throughput; dashed rules mark the runs where a row's `batch`, description or the
primary library's version changed; a **Relative to first run** toggle indexes every line to its own first plotted run;
and the sticky control panel folds to its scenario row while scrolling unless pinned. A scenario's group and description
come from the newest run that recorded them rather than the oldest, so a row a suite regroups moves with it.
