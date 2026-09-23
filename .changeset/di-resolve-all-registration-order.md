---
"@codefast/di": patch
---

`resolveAll` returns a token's bindings in registration order however a chain refines its own binding. Binding a default
and then a named, tagged, member or predicate binding used to list the later one first, because the refinement re-added
what it had displaced behind it; each binding now keeps the place its first registration gave it.
