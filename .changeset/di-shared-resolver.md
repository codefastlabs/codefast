---
"@codefast/di": patch
---

The six resolve methods are declared once, on a new exported `Resolver` interface that both `Container` and
`ResolutionContext` extend, so a call through a factory's `ctx` can never again narrow a token's slot names differently
from the same call on the container. Types only: the emitted JavaScript is unchanged.
