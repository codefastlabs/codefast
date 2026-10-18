---
"@benchmark/di": minor
---

`pnpm bench:results` also writes `results.json` beside `RESULTS.md`: the baseline's facts as data — the libraries and
their versions, the machine, the profile, the aggregates per competitor and every loss with its ratio — built from the
same comparison and held by the same `pnpm bench:results:check`. The codefastlabs.com home page reads its scoreboard
from that file instead of parsing the page, so `RESULTS.md`'s prose no longer has a shape to keep.
