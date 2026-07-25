---
"@codefast/di": patch
---

`unbind(token)` now drops the token's bindings in a single registry pass instead of removing them one id at a time. The previous path re-scanned and re-indexed the token's binding list once per binding — quadratic in the number of slots bound to that token — and bumped the registry version once per removal, invalidating resolver lookup caches repeatedly. Behaviour is unchanged, including deactivation of cached singletons.
