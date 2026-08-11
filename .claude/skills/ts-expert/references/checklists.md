# Diagnostic checklists

Everything `oxlint` already enforces is deliberately absent — see standing rule 1 in `SKILL.md`.

## A. Type safety

Default to AUTO-FIX.

- `as` casts → type guards, or `satisfies` when the shape can be validated.
- Missing `readonly` on data that is never mutated.
- Weak return types (`object`, `{}`, `any[]`) hiding a knowable shape.
- Discriminated unions with no exhaustiveness check — add the `never` arm.
- Optional properties that may receive an explicit `undefined` under `exactOptionalPropertyTypes` — these need
  `?: T | undefined`, and the workspaces where the flag is off are exactly where this bug hides until the flag is turned
  on.

## B. Platform features

Usually PROPOSE. The compiler version never gates these — `lib` and the runtime do, so confirm both before suggesting
one.

- `Map.getOrInsert` / `WeakMap.getOrInsert` over manual `has()` + `set()` — needs Node ≥ 26.
- `RegExp.escape()` over hand-rolled escaping.
- Temporal over `Date` arithmetic.
- `using` / `await using` for connections, file handles, listeners.
- `#/…` subpath imports over `../../..` chains. This is a `package.json#imports` feature, not a TypeScript one; every
  runner in this repo resolves it, but confirm the target lists its extension candidates before adding one.

## C. tsconfig hygiene

All PROPOSE — a shared preset cascades across every workspace.

The question is **not** "is this flag on?" but **"is it set in exactly one place?"** A flag copy-pasted into per-package
tsconfigs is a Layer 3 DRY violation (see `dry-taxonomy.md`), and it silently leaves out whichever workspace nobody
remembered to edit. Regenerate the real picture rather than trusting this file or CLAUDE.md:

```bash
for f in exactOptionalPropertyTypes verbatimModuleSyntax noImplicitOverride noUncheckedIndexedAccess strict; do
  echo "== $f"; grep -rln "\"$f\"" --include="*.json" . | grep -v node_modules
done
```

Read `packages/typescript-config/*.json` first — a flag that belongs in `base.json` but appears in several package
tsconfigs instead is the finding. Report which workspaces are missing it, since those are the ones whose bugs the flag
would have caught.

`strict`, `noUncheckedIndexedAccess`, `moduleResolution: bundler` and `target: ESNext` already live in `base.json`;
confirm rather than assume, and don't report a flag as missing without checking the preset the package extends.

## D. API design

Mostly PROPOSE, though a breaking reshape is cheap here — see rule 6 in `SKILL.md`.

- More than two positional parameters → an options object.
- Loose generic constraints (`<Value>` → `<Value extends …>`).
- A multi-signature function that would read better as overloads.
- A barrel `index.ts` re-exporting everything. Note this repo generates per-subpath exports from `dist/` with
  `codefast mirror`, so a hand-written barrel is usually the anomaly.
- Deep recursive conditional types — real compiler cost, worth measuring before defending.
