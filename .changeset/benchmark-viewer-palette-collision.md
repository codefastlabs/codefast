---
"@codefast/benchmark-viewer": patch
---

Give every series its own colour. The chart palette held five hues while the `di` suite plots seven libraries, so
`paletteMap`'s modulo handed two pairs the same colour (`@codefast/di` and `ditox` both teal, `inversify` and
`injection-js` both blue) — indistinguishable on the chart. The palette now carries seven distinct hues, and a note
records that it must stay at least as long as the largest suite's library count.
