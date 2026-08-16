---
"@codefast/di": patch
---

perf(di): index multi-tag slots by their first criterion for subset selection

A name-less multi-tag `resolve` over a wide variant set no longer scans the token's whole binding list: multi-tag slots
are bucketed under their first criterion, and since a matching slot's every tag is in the request, walking the request's
buckets (plus the single-tag index) finds each candidate exactly once — no dedup set, no extra per-resolve allocation.
The lane engages only past a size threshold on the token's list (under it the generic scan is cheaper) and serves
`resolve` only, so `resolveAll` keeps its result order. Selection semantics — subsets, specificity, predicates,
ambiguity — are unchanged.
