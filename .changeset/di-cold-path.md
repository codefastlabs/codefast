---
"@codefast/di": patch
---

The cold path allocates only what it uses: a container builds its lookup memo, class introspector, context pools and
lone map on first use; a root's plan is compiled on the request that repeats it, so a container that resolves a root
once never compiles; a binding's activation need is stamped on the binding instead of memoized in a per-resolver map
(`ResolutionDiagnostics.builtSubsystems` no longer lists `resolver.activationNeedMemo`); teardown clears instances
without splicing the singleton list or pairing each binding; a rebind of a lone token is one registration whose
displaced binding is deactivated on the spot; a fresh registration is one probe and one write; a chain's own `.many()`
re-slots without probing the registry; each error class names itself with a literal.
