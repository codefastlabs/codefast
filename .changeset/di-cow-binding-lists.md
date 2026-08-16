---
"@codefast/di": patch
---

perf(di): make token binding lists copy-on-write so selection drops its snapshot

The registry now replaces a token's binding list on `add`/`removeById` instead of splicing it in place, so a selection
walking the list while a `when()` predicate rebinds the token keeps its own pre-mutation array by construction. The
defensive per-selection copy in binding selection is gone — predicate-bearing `resolveAll` fan-outs no longer pay an
allocation per call. Observable behavior is unchanged: the mid-selection-rebind pin test passes as written.
