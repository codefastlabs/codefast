---
"@codefast/di": patch
---

The binding registry keeps one record per token — its list and its two tagged indexes — in a single map, and builds the
binding-id index only on the first id-keyed operation. A bind into a fresh token is one record and one map write where
it was three map writes; `getFastDefault()` keeps its own map so the warm resolve lane still answers from one bare
`Map.get`. Measured paired and alternating against the previous layout: the bind path runs at roughly 1.6× on the
128-binding registration row and the warm resolve rows hold at parity.
