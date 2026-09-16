# Diagnostic checklists

Everything the project's linter already enforces is deliberately absent — see standing rule 1 in `SKILL.md`.

## A. Type safety

Default to AUTO-FIX.

- `as` casts → type guards, or `satisfies` when the shape can be validated.
- Missing `readonly` on data that is never mutated.
- Weak return types (`object`, `{}`, `any[]`) hiding a knowable shape.
- Discriminated unions with no exhaustiveness check — add the `never` arm.
- Optional properties that may receive an explicit `undefined` under `exactOptionalPropertyTypes` — these need
  `?: T | undefined`, and the configs where the flag is off are exactly where this bug hides until the flag is turned
  on.

## B. Platform features

Usually PROPOSE. The compiler version never gates these — `lib` and the runtime do, so confirm both before suggesting
one, and prefer a small helper or a maintained polyfill where the target can't guarantee support.

- `Map.getOrInsert` / `WeakMap.getOrInsert` over manual `has()` + `set()` — standardised only in ES2027 (Baseline 2026),
  so propose it only where the runtime and `lib` cover it; otherwise a local upsert helper or a `core-js` polyfill.
- `RegExp.escape()` over hand-rolled escaping — ES2027 (Baseline 2025); verify runtime support.
- `Temporal` over `Date` arithmetic — still Stage 3 with limited native support; verify before proposing.
- `using` / `await using` for connections, file handles, listeners — needs TypeScript ≥ 5.2 and a runtime (or polyfill)
  providing `Symbol.dispose` / `Symbol.asyncDispose`.
- Node subpath imports (`#/…` from `package.json#imports`) over `../../..` chains — this is a package.json feature, not
  a TypeScript one; propose it only where the project already uses it, and confirm the target lists its extension
  candidates.

## C. tsconfig hygiene

All PROPOSE — a shared preset cascades across every config that extends it.

The question is **not** "is this flag on?" but **"is it set in exactly one place?"** A flag copy-pasted into per-package
tsconfigs is a Layer 3 DRY violation (see `dry-taxonomy.md`), and it silently leaves out whichever config nobody
remembered to edit. Regenerate the real picture rather than trusting this file:

```bash
for f in exactOptionalPropertyTypes verbatimModuleSyntax noImplicitOverride noUncheckedIndexedAccess strict; do
  echo "== $f"; grep -rln "\"$f\"" --include="*.json" . | grep -v node_modules
done
```

Read the shared/base tsconfig the packages extend first — a flag that belongs in the base but appears in several package
tsconfigs instead is the finding. Report which configs are missing it, since those are the ones whose bugs the flag
would have caught.

Don't report a flag as missing without checking the preset the config extends: confirm whether `strict`,
`noUncheckedIndexedAccess`, `moduleResolution`, and `target` already live in the base rather than assuming.

## D. API design

Mostly PROPOSE, though a breaking reshape may be cheap — see rule 6 in `SKILL.md`.

- More than two positional parameters → an options object.
- Loose generic constraints (`<Value>` → `<Value extends …>`).
- A multi-signature function that would read better as overloads.
- A barrel `index.ts` re-exporting everything — a finding when the project's export strategy doesn't want it (it defeats
  tree-shaking and per-subpath exports). Check the project's convention before flagging.
- Deep recursive conditional types — real compiler cost, worth measuring before defending.
