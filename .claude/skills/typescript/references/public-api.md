# Public API

What a package exports is a contract its consumers compile against, so reshapes here are mostly PROPOSE and always name
the breaking change.

## Shape

- Every type named in an exported signature is itself exported — otherwise consumers reconstruct it with
  `Parameters<typeof fn>[0]`.
- Exported declarations are typed explicitly enough for a declaration emitter to write them without inference; proposing
  `isolatedDeclarations` makes that checkable.
- Code that runs without a compile step avoids syntax a type-stripping runtime cannot erase — `enum`, a `namespace`
  holding values, parameter properties, `import x = require()`, `<Type>value` — and `erasableSyntaxOnly` enforces it.
- A barrel `index.ts` re-exporting everything is a finding only where the project's export strategy (per-subpath
  exports, tree-shaking) says so.

## Type tests

A public generic type is untested until a test shows what it rejects. Use the project's type-test location and library,
and confirm the matcher names in that library's installed `.d.ts` first.

- Pin exact inference (`toEqualTypeOf`) and put `@ts-expect-error` on each call that must not compile: an unknown name,
  a wrong payload, a missing argument.
- For a generic container or emitter, assert assignability in both directions between two instantiations — that is where
  loose variance shows.
- A negative test proves nothing until it has failed once: break the type, watch the test go red, restore it.
