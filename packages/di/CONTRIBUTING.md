# Contributing to `@codefast/di`

The full workflow for changing this package's source. Steps marked **(conditional)** only apply when their trigger is
true. For repo-wide conventions see the root [CLAUDE.md](../../CLAUDE.md); this file is the `packages/di`-specific
checklist.

## 0. Scope the change first

Classify it — bug fix / feature / refactor / **perf** — because the perf-verify step (5) is mandatory only for hot-path
changes.

Ground rules that bite in this package specifically:

- **Node ≥ 26 required** — the resolver uses native `Map.prototype.getOrInsert`. `engines.node` is `>=26`; examples
  polyfill it by hand to still run on Node 24.
- `exactOptionalPropertyTypes` is on — an optional prop that may receive an explicit value is typed `?: T | undefined`.
- The sync and async resolve pipelines live in **one class** (`resolution/resolver.ts`) because `#` private fields
  cannot span files and both pipelines touch the same private state on every hop. Everything that does _not_ need that
  state is already a named collaborator (`binding-lookup-cache`, `class-introspector`, `activation-need`,
  `instantiation-plan`) — extend those rather than growing the engine.
- **Before touching `resolution/` or `registry`, read [ARCHITECTURE.md](./ARCHITECTURE.md).** It records the invariants
  the hot paths depend on — the single binding construction site and its hidden class, why the resolution contexts are
  pooled, which cycle-detection mechanism each lane uses and why they differ, and the rule that a threshold may choose
  an implementation but never a semantics. Several of these look like they could be simplified and cannot.
- **Two documents sit alongside it, and the boundary between the three is load-bearing.**
  [PERFORMANCE.md](./PERFORMANCE.md) is what each shape costs and by what method; [REJECTED.md](./REJECTED.md) is what
  has been tried against the engine and lost. Read REJECTED.md before proposing an optimization here — most of the
  obvious ones are on it, each with the figure a new attempt has to beat. When you add to any of them: a figure goes in
  PERFORMANCE or REJECTED, an invariant goes in ARCHITECTURE, and a dated suite run goes in
  [benchmarks/di-inversify/RESULTS.md](../../benchmarks/di-inversify/RESULTS.md).

## 1. Write the code

- Internal imports use the `#/` subpath imports declared in `package.json#imports` (e.g. `#/resolution/resolver`). Do
  **not** add `compilerOptions.paths` for internal aliases.
- Keep `import type` separate from value imports.
- Doc comments are **TSDoc**, one concise line stating the _why_. **Never hand-write an `@since` tag** — `codefast tag`
  stamps it at release. Every export here already carries one, so a new export looks unfinished without it; the absence
  is correct. Check rather than remember: `git diff --cached | grep -E '^\+.*@since'` — any hit is a bug, and a removed
  tag is a bug too unless the symbol is gone.
- **Three prose lines is the cap, and no numbers, history, or document pointers in source comments.** A longer _why_
  belongs in [ARCHITECTURE.md](./ARCHITECTURE.md) and a number in [PERFORMANCE.md](./PERFORMANCE.md), but do **not**
  link to either from the code — state the invariant in the comment instead. A pointer rots silently: section numbers
  shift and topic phrases outlive their section, and nothing type-checks either. This package's comments once accreted
  into per-site essays defending each optimization — the doc is where that argument goes, once.
  `tests/unit/architecture.test.ts` fails on `.md`, `SPEC §`, benchmark numbers, and history wording; grep your diff for
  `used to`, `previously`, `the old`, `×`, `%` and `ns/op` before pushing.
- Audit any new/changed public API (exported function/type/prop/option) against the Swift-style naming rubric in
  CLAUDE.md.
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

TS7 emits `.js` + `.d.ts` per file; there is no bundler. `apps/ui` consumes the built `dist/`, so run
`pnpm build:packages` before testing an app against your change.

## 4. Test

Tests live under exactly one of `tests/{unit,integration,e2e,types}/**`, mirroring the `src/` path
(`src/resolution/resolver.ts` → `tests/unit/resolution/resolver.test.ts`). Never under `src/`.

```bash
pnpm --filter @codefast/di test:unit   # or test:integration / test:type / test:e2e
```

Add coverage for the new behavior.

## 5. Guard performance — (conditional: touched resolver / resolution / registry hot paths)

A resolver refactor is **not** free until measured. Check [REJECTED.md](./REJECTED.md) before you build it and
[PERFORMANCE.md](./PERFORMANCE.md) for what the shape is currently worth, then run the head-to-head, order-independent:

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

- Compare against a baseline run on the same machine, **stashed and rebuilt** — not against numbers from an earlier
  session.
- Three trials per side — the ceiling as well as the floor — and compare the **best** of each rather than one median:
  ambient load only ever subtracts throughput, and a single run cannot separate a 5% change from noise. A 5%
  "regression" in this suite has twice turned out to be nothing.
- If optimizing, sweep depth 16 → 512 and confirm you did not regress the deep-chain wins.
- **Measure cold paths too.** Container construction and binding registration are invisible to the hot loops and have
  been the source of the suite's real losses. A change that wins `transient-class-1-dep` can lose
  `realistic-graph-cold-resolve` outright.
- **Validate a perf hypothesis by throwaway ablation, not by reasoning.** Build the variant, measure it, delete it.
  Several plausible mechanisms in this package's history were wrong in the direction their author expected.
- Known weak spots to watch (see [benchmarks/di-inversify/RESULTS.md](../../benchmarks/di-inversify/RESULTS.md)):
  per-hop dispatch in `#resolveDefaultEntry`, and cold container build against the leaner containers.
- For a material perf change, run the publishable profile, then record the run in RESULTS.md and what the shape is now
  worth in [PERFORMANCE.md](./PERFORMANCE.md) — or, if you are dropping the attempt, in [REJECTED.md](./REJECTED.md)
  with its cost:

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

## 6. Static checks

```bash
pnpm check       # lint + format:check + check-types (no auto-fix)
pnpm check:fix   # lint:fix + format (writes fixes)
```

Lint/format is Oxc (`oxlint --deny-warnings`, `oxfmt`). If you edited files via a script rather than the editor, run
`pnpm format` and `pnpm lint:fix` by hand — this repo has no post-write formatting hook.

## 7. Verify consumers — (conditional: changed a public API surface)

`apps/ui` and `examples/*` consume the built package. Verify the **production** build, not just `dev` — client
import-protection and prerendering only surface at build time:

```bash
pnpm build:packages
pnpm --filter @apps/ui build
```

## 8. Changeset

```bash
pnpm changeset
```

All `@codefast/*` are one `fixed` group and version together at the highest bump. **Never author a `major`** — there is
no 1.0 planned, and breaking changes are `minor`. Whether the repo is currently in canary pre-release mode is a thing to
read, not to remember (`test -f .changeset/pre.json`), because it flips either way; use the `release` skill for the
publish flow.

## 9. Full gate before commit / PR

```bash
pnpm verify   # build:packages + lint:fix + format + check-types + test:coverage
```

## 10. Commit

Conventional Commits (commitlint-enforced). If you are on `main`, branch first. Update this package's README/docs when
the public API changes — and leave `@since` to CI.

---

### Fast path for a resolver tweak

`edit resolution/resolver.ts` → `build` → `test:unit` → `bench:isolate` (guard regressions) → `pnpm verify` →
`changeset` → commit.
