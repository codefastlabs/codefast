---
"@codefast/benchmark-viewer": minor
---

The chart can overlay every row of the selected scenario's group — one line per row and library, colour by row, dash
pattern by library, the selected row drawn heavier — so the configurations of one workload read against each other on a
single chart instead of one chart per row. Bands and ratio lines stay off while the overlay is on. A `viewDefaults`
server option lets a suite open with the overlay and the log axis already on. A scenario's group and description now
come from the newest run that recorded it rather than the oldest, so a row a suite regroups moves with it instead of
staying where its earliest saved run put it.
