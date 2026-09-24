# DRY

DRY removes duplicated knowledge, not duplicated text, and it runs at three layers — a codebase can be spotless in its
code and drifting in its types.

## When not to extract

- **Derivation has no threshold; extraction does.** A hand-written copy of a type that already exists is drift the day
  it is written. Code that merely looks alike is extracted on the third occurrence, not the second.
- **Code that changes for different reasons stays apart.** Two blocks that match today but serve different callers
  couple those callers the moment they share a helper.
- **A new abstraction is PROPOSE.** Extracting a function is local; introducing a `Result` type, a base class, or a
  mixin changes how the project is written.

## Layers

- **Types** — a shape re-declared instead of derived (`Pick`/`Omit`/`Partial`, `ReturnType`, `Parameters`, mapped and
  template-literal types); a literal compared in many places beside a hand-written union (derive both from one
  `as const` object); a schema and its type written twice (`z.infer`).
- **Code** — repeated guard clauses (one `asserts x is Target` function); the same pipeline or try/catch transform
  copied (one function); repeated `switch` dispatch (an exhaustive `Record<Key, Handler>`); class boilerplate (a shared
  function or a collaborator held in a field — a base class only for a genuine is-a family).
- **Structure** — duplicated test fixtures (shared helpers where the project's test setup discovers them); config
  repeated across files, above all a tsconfig flag copy-pasted into per-package configs, which silently leaves out
  whichever config nobody edited.

Report findings per layer, then the places most likely to be copied next, one line each.
