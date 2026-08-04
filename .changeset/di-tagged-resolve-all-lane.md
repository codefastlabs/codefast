---
"@codefast/di": patch
---

`resolveAll(token, { tag })` reads the tagged index instead of scanning every binding under the token. `resolveAll` has had a fast lane for a name-only request since the name index existed; the identical shape for a one-tag request was missing, for a reason that had expired. `simpleTagOf` kept predicate-bearing bindings out of the tag index, justified by the index being "read without a re-check" — which stopped being true when the `±0` fix gave every indexed hit a re-check. With the premise gone the exclusion was vestigial, and it was the only thing keeping `resolveAll` off the index.

Both lanes that read the index now evaluate the predicate on what they find, exactly as the name lane always has, so an indexed hit whose `when()` refuses still cannot reach a caller.

Worth **1.72×** on a `resolveAll` over a tagged token, nine passes and every one positive, landing that row at the throughput the equivalent name lane already had. Single-tag `resolve`, the name lanes, and the sync controls hold.

One row moves the other way and is recorded rather than explained: `resolveAll` with no options over a hundred pure-predicate bindings measures **0.95×**, nine passes inside a one-percent spread. It has no causal path — that request leaves candidate selection at its first test and never reaches the index or any new code — and the obvious remedy, keeping the caller its original size, did not move it. It reads as a code-layout effect; the experiment that would confirm that has not been run yet.
