---
"@codefast/di": patch
---

Route every member of a `resolveAllAsync` collection that is a transient factory with no activation and no request
options through the same non-`async` lane a single `resolveAsync` already takes, so a fan-out costs one factory promise
per member instead of an async state machine on top of each.
