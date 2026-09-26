---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a pass over the tree that fixes two regressions the pass before it exposed: the tagged
lookups had slowed after the disposed-chain guard outgrew the inline budget, and a request missing every slot probed for
a default-slot alias even where none was ever bound. The cold-class and collection rows show the lookups that landed
since the previous baseline, and the page names what still loses, including the tagged lookups that read slower only in
the harness child. The run's `observations.jsonl` is committed under `baselines/`; the pass it replaces is removed.
