# Contributing to `@codefast/di`

The full workflow for changing this package's source. Steps marked **(conditional)** only apply when their trigger is true. For repo-wide conventions see the root [CLAUDE.md](../../CLAUDE.md); this file is the `packages/di`-specific checklist.

## 0. Scope the change first

Classify it — bug fix / feature / refactor / **perf** — because the perf-verify step (5) is mandatory only for hot-path changes.

Ground rules that bite in this package specifically:

- **Node ≥ 26 required** — the resolver uses native `Map.prototype.getOrInsert`. `engines.node` is `>=26`; examples polyfill it by hand to still run on Node 24.
- `exactOptionalPropertyTypes` is on — an optional prop that may receive an explicit value is typed `?: T | undefined`.
- The resolver is deliberately **one class** (`resolution/resolver.ts`) because `#` private fields cannot span files. Resolver changes go there, not in a new file.
- Before touching `resolution/` or `registry`, read the "packages/di layout" section in [CLAUDE.md](../../CLAUDE.md) — the hot paths carry perf-tuned idioms (chain-versioned lookup memos, compiled class plans, a uniform binding hidden class) that a naive refactor can silently deoptimize.

## 1. Write the code

- Internal imports use the `#/` subpath imports declared in `package.json#imports` (e.g. `#/resolution/resolver`). Do **not** add `compilerOptions.paths` for internal aliases.
- Keep `import type` separate from value imports.
- Doc comments are **TSDoc**, one concise line stating the _why_. **Never hand-write an `@since` tag** — `codefast tag` stamps it at release.
- Audit any new/changed public API (exported function/type/prop/option) against the Swift-style naming rubric in CLAUDE.md.
- No speculative features — every new public API needs a real call site.

## 2. Regenerate exports — (conditional: added/moved/renamed a module)

`package.json#exports` is **generated from `dist/`** by `codefast mirror`, never edited by hand:

```bash
pnpm --filter @codefast/di build   # mirror reads dist/, so build first
pnpm cli:mirror:preview            # dry-run: review the exports diff
pnpm cli:mirror                    # write package.json#exports
```

Requires `packages/cli/dist` to exist (build the CLI if it doesn't).

## 3. Build

```bash
pnpm --filter @codefast/di build   # rm -rf dist && tsc -p tsconfig.build.json (clean, no incremental)
```

TS7 emits `.js` + `.d.ts` per file; there is no bundler. `apps/ui` consumes the built `dist/`, so run `pnpm build:packages` before testing an app against your change.

## 4. Test

Tests live under exactly one of `tests/{unit,integration,e2e,types}/**`, mirroring the `src/` path (`src/resolution/resolver.ts` → `tests/unit/resolution/resolver.test.ts`). Never under `src/`.

```bash
pnpm --filter @codefast/di test:unit   # or test:integration / test:type / test:e2e
```

Add coverage for the new behavior.

## 5. Guard performance — (conditional: touched resolver / resolution / registry hot paths)

A resolver refactor is **not** free until measured. Run the head-to-head, order-independent:

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

- Compare against a baseline run on the same machine.
- If optimizing, sweep depth 16 → 512 and confirm you did not regress the deep-chain wins.
- Known weak spots to watch (see [benchmarks/di-inversify/RESULTS.md](../../benchmarks/di-inversify/RESULTS.md)): per-hop dispatch in `#resolveDefaultEntry`, cold container build, short async chains.
- For a material perf change, run the publishable profile and update RESULTS.md:

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

## 6. Static checks

```bash
pnpm check       # lint + format:check + check-types (no auto-fix)
pnpm check:fix   # lint:fix + format (writes fixes)
```

Lint/format is Oxc (`oxlint --deny-warnings`, `oxfmt`). If you edited files via a script rather than the editor, run `pnpm format` and `pnpm lint:fix` by hand — this repo has no post-write formatting hook.

## 7. Verify consumers — (conditional: changed a public API surface)

`apps/ui` and `examples/*` consume the built package. Verify the **production** build, not just `dev` — client import-protection and prerendering only surface at build time:

```bash
pnpm build:packages
pnpm --filter @apps/ui build
```

## 8. Changeset

```bash
pnpm changeset
```

All `@codefast/*` are one `fixed` group and version together at the highest bump. **While on 0.x, never author a `major`** — breaking changes are `minor`. The repo is in canary pre-release mode; use the `release` skill for the publish flow.

## 9. Full gate before commit / PR

```bash
pnpm verify   # build:packages + lint:fix + format + check-types + test:coverage
```

## 10. Commit

Conventional Commits (commitlint-enforced). If you are on `main`, branch first. Update this package's README/docs when the public API changes — and leave `@since` to CI.

---

### Fast path for a resolver tweak

`edit resolution/resolver.ts` → `build` → `test:unit` → `bench:isolate` (guard regressions) → `pnpm verify` → `changeset` → commit.
