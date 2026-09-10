---
"@codefast/benchmark-viewer": patch
---

Rework the chart palette so every series is easy to tell apart. It held five hues while the `di` suite plots seven
libraries, so `paletteMap`'s modulo handed two pairs the same colour (`@codefast/di` and `ditox` both teal, `inversify`
and `injection-js` both blue). The palette now carries seven hues chosen for the widest pairwise separation — its
closest pair is far more distinct than before, no two lines read alike, and each hue also stays clear of the ratio
colours. A note records that it must stay at least as long as the largest suite's library count.
