---
"@codefast/di": patch
---

`validate`, `explain` and `generateDependencyGraph` read a container's internals from an object built once per container
instead of rebuilding it, with the ancestor-registry list, on every call. `validate` also walks the container's bindings
once rather than twice and allocates nothing for a container with no container-level hooks, so it costs less than the
`container.validate()` method did in 0.13.0.
