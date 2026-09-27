---
"@codefast/di": patch
---

A rebind that owes no teardown allocates nothing for the binding it displaces, and a collection read skips its scan for
dangling aliases in a chain that never held one.
