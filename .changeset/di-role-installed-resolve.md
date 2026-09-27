---
"@codefast/di": patch
---

A root container's `resolve(token, options)` no longer pays for the check a child makes that no ancestor was disposed.
Each container is created with the `resolve` of its role, so the root's never carries the child's path and the rule that
a disposed ancestor refuses its descendants stays as it was.
