---
"@codefast/di": patch
---

Compile an accessor-injected class as a plan root instead of declining the plan: its constructor parameters compile as
usual and construction runs through the host, which puts the class's frame on the resolution path and the container
ambient before constructing, so an accessor that cycles back is still reported as a `CircularDependencyError`. Below a
plan's root such a class stays an escape.
