---
"@codefast/cli": minor
---

Add `codefast audit props`, which reports every `*Props` type alias joined with `&` that an interface could express — at
the alias's top level, or passed to the type it wraps. The native TypeScript type server decides it: an alias keeps its
`&` when a part resolves to a union, a type parameter or a mapped type over one, or no object at all, so the forms that
must stay intersections need no allowlist. A part that does not resolve is reported rather than passed. The type server
starts only for a file that holds a candidate and needs `typescript` (v7); `audit.props.allowlist` takes the alias's
first line as written, or `path:<line>`.
