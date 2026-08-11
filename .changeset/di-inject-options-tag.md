---
"@codefast/di": minor
---

`inject()`, `optional()` and `injectAll()` accept the single-tag shorthand. `container.resolve(Token, { tag: pair })`
has always been valid while `inject(Token, { tag: pair })` was a compile error, so the same request had two vocabularies
depending on whether you were asking a container or declaring a dependency — and the one a constructor dependency had to
use was the longer one.

`InjectOptions` gains `tag`, and that is the whole surface change. Nothing downstream learns a second spelling: the
shorthand is folded into `tags` where the descriptor is built, so `InjectionDescriptor`, `ParamMetadata`, the plan
compiler and the dependency graph keep seeing exactly one tag list. Passing both is a request for every pair across the
two, which is what the matcher already did with them.

While that path was open: an `@inject` accessor was rebuilding its resolve options on **every constructed instance**,
from the raw options rather than from the descriptor. It now derives them once, from the descriptor — so the accessor
honours the shorthand for free, and stops allocating per instance.

Measured against the previous build on the bind and boot rows, paired and alternating: parity everywhere, controls
clean.
