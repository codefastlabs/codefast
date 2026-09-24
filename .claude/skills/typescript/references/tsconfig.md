# tsconfig and platform APIs

Both are decided by configuration rather than code: flags by the tsconfig chain, platform APIs by `lib` and the runtime
target. All PROPOSE — a shared preset cascades across every config that extends it.

## Flag placement

The question is **not** "is this flag on?" but **"is it set in exactly one place?"** A flag copy-pasted into per-package
tsconfigs silently leaves out whichever config nobody remembered to edit. With a single tsconfig there is nothing to
drift, so skip this section. Otherwise regenerate the real picture rather than trusting this file:

```bash
for f in exactOptionalPropertyTypes verbatimModuleSyntax noImplicitOverride noUncheckedIndexedAccess strict \
  isolatedDeclarations erasableSyntaxOnly; do
  echo "== $f"; grep -rln "\"$f\"" --include="*.json" . | grep -v node_modules
done
```

Read the shared/base tsconfig the packages extend first — a flag that belongs in the base but appears in several package
tsconfigs instead is the finding. Report which configs are missing it, since those are the ones whose bugs the flag
would have caught. Confirm whether `strict`, `noUncheckedIndexedAccess`, `moduleResolution`, and `target` already live
in the base before reporting one as missing.

## Platform APIs

The compiler version never gates these — `lib` and the runtime do, so confirm both before suggesting one, and prefer a
small helper or a maintained polyfill where the target can't guarantee support. Find the `lib` an API needs by grepping
the installed TypeScript's `lib.*.d.ts` files for it rather than recalling an edition: the file name is the edition, and
`esnext` means no published edition yet. TypeScript 7 ships those files in its platform package
(`@typescript/typescript-<platform>/lib`).

- `Map.getOrInsert` / `getOrInsertComputed` (and the `WeakMap` pair) over manual `has()` + `set()`.
- `RegExp.escape()` over hand-rolled escaping.
- `Temporal` over `Date` arithmetic.
- `using` / `await using` for connections, file handles, listeners — needs a runtime (or polyfill) providing
  `Symbol.dispose` / `Symbol.asyncDispose`.
- Node subpath imports (`#…` from `package.json#imports`) over `../../..` chains — a package.json feature, not a
  TypeScript one; propose it only where the project already uses it, and confirm the target lists its extension
  candidates.
