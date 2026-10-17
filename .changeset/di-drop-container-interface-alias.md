---
"@codefast/di": minor
---

**Breaking:** the `ContainerInterface` type export is removed. It aliased the `Container` interface, which `Container`
already exports under its own name beside the value, so replace `ContainerInterface` with `Container`.
