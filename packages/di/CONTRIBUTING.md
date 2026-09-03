# Contributing to `@codefast/di`

The full workflow for changing this package's source. Steps marked **(conditional)** only apply when their trigger is
true. For repo-wide conventions see the root [CLAUDE.md](../../CLAUDE.md); this file is the `packages/di`-specific
checklist.

## Scope the change first

Classify it — bug fix / feature / refactor / **perf** — because the perf-verify step is mandatory only for hot-path
changes.

Ground rules that bite in this package specifically:

- **Node ≥ 24** — `engines.node` is `>=24`, and the package keeps its own `Map` upsert helpers
  ([`core/map-upsert.ts`](./src/core/map-upsert.ts)) to hold that floor. Calling the platform's ES2025
  `Map.prototype.getOrInsert` instead would raise it to 26, which the serverless runtimes this package deploys to do not
  offer. That floor is mechanical, not a reminder: this package's `tsconfig.json` pins `lib` to
  `["ES2024", "ESNext.Decorators"]`, so an ES2025 builtin is a compile error here even though the repo runs Node 26 and
  CI would never catch it at runtime. Reaching for one means proving Node 24 ships it and widening `lib` deliberately.
- `exactOptionalPropertyTypes` is on — an optional prop that may receive an explicit value is typed `?: T | undefined`.
- The sync and async resolve pipelines live in **one class** (`resolution/resolver.ts`) because `#` private fields
  cannot span files and both pipelines touch the same private state on every hop. Everything that does _not_ need that
  state is already a named collaborator (`binding-lookup-cache`, `class-introspector`, `activation-need`,
  `instantiation-plan`) — extend those rather than growing the engine.
- **Before touching `resolution/` or `registry`, read [ARCHITECTURE.md](./ARCHITECTURE.md).** It records the invariants
  the hot paths depend on — the single binding construction site and its hidden class, why the resolution contexts are
  pooled, which cycle-detection mechanism each lane uses and why they differ, and the (correctness) invariant that a
  threshold may choose an implementation but never a semantics. Several of these are load-bearing in ways that aren't
  obvious from the code — understand why before you simplify one; a few turn out to be genuine correctness invariants.
  Treat it as working notes, not law — the invariants are the load-bearing part; any performance rationale in it is a
  pointer to go measure, not a settled fact.
- **Numbers are empirical, and the benchmark suite is where they live.** What a shape costs, and whether a new idea
  beats it, is answered by re-running [`benchmarks/di-inversify`](../../benchmarks/di-inversify/README.md), not by a
  figure written into a doc — [`BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md) is the method and
  [benchmarks/di-inversify/RESULTS.md](../../benchmarks/di-inversify/RESULTS.md) is the dated per-run ledger. When you
  add to the docs, an invariant goes in ARCHITECTURE and a dated suite run goes in RESULTS.md.

## Write the code

- Internal imports use the `#/` subpath imports declared in `package.json#imports` (e.g. `#/resolution/resolver`). Do
  **not** add `compilerOptions.paths` for internal aliases.
- Keep `import type` separate from value imports.
- Doc comments are **TSDoc**, one concise line stating the _why_. **Never hand-write an `@since` tag** — `codefast tag`
  stamps it at release. Every export here already carries one, so a new export looks unfinished without it; the absence
  is correct. Check rather than remember: `git diff --cached | grep -E '^\+.*@since'` — any hit is a bug, and a removed
  tag is a bug too unless the symbol is gone.
- **Three prose lines is the cap, and no numbers, history, or document pointers in source comments.** A longer _why_
  belongs in [ARCHITECTURE.md](./ARCHITECTURE.md) and a number belongs with its method (the benchmark suite or its
  RESULTS.md), but do **not** link to either from the code — state the invariant in the comment instead. A pointer rots
  silently: section numbers shift and topic phrases outlive their section, and nothing type-checks either. This
  package's comments once accreted into per-site essays defending each optimization — the doc is where that argument
  goes, once. Grep your diff for `.md`, `SPEC §`, `used to`, `previously`, `the old`, `×`, `%` and `ns/op` before
  pushing.
- Audit any new/changed public API (exported function/type/prop/option) against the Swift-style naming rubric in
  CLAUDE.md.
- No speculative features — every new public API needs a real call site.

## Regenerate exports — (conditional: added/moved/renamed a module)

`package.json#exports` is **generated from `dist/`** by `codefast mirror`, never edited by hand:

```bash
pnpm --filter @codefast/di build   # mirror reads dist/, so build first
pnpm cli:mirror:preview            # dry-run: review the exports diff
pnpm cli:mirror                    # write package.json#exports
```

Requires `packages/cli/dist` to exist (build the CLI if it doesn't).

## Build

```bash
pnpm --filter @codefast/di build   # rm -rf dist && tsc -p tsconfig.build.json (clean, no incremental)
```

TS7 emits `.js` + `.d.ts` per file; there is no bundler. `apps/ui` consumes the built `dist/`, so run
`pnpm build:packages` before testing an app against your change.

## Test

Tests live under exactly one of `tests/{unit,integration,e2e,types}/**`, mirroring the `src/` path
(`src/resolution/resolver.ts` → `tests/unit/resolution/resolver.test.ts`). Never under `src/`.

```bash
pnpm --filter @codefast/di test:unit   # or test:integration / test:type / test:e2e
```

Add coverage for the new behavior.

<a id="guard-performance"></a>

## Guard performance — (conditional: touched resolver / resolution / registry hot paths)

A resolver refactor's cost isn't known until it's measured. Run the head-to-head, order-independent suite against a
freshly rebuilt baseline:

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
- For a material perf change (kept or dropped), run the publishable profile and record the dated run in
  [RESULTS.md](../../benchmarks/di-inversify/RESULTS.md) — that ledger is the record now, so a dropped attempt with its
  cost goes there too:

```bash
BENCH_MODE=full BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

## Static checks

```bash
pnpm check       # lint + format:check + check-types (no auto-fix)
pnpm check:fix   # lint:fix + format (writes fixes)
```

Lint/format is Oxc (`oxlint --deny-warnings`, `oxfmt`). If you edited files via a script rather than the editor, run
`pnpm format` and `pnpm lint:fix` by hand — this repo has no post-write formatting hook.

## Verify consumers — (conditional: changed a public API surface)

`apps/ui` and `examples/*` consume the built package. Verify the **production** build, not just `dev` — client
import-protection and prerendering only surface at build time:

```bash
pnpm build:packages
pnpm --filter @apps/ui build
```

## Changeset

```bash
pnpm changeset
```

Every `@codefast/*` package versions independently, so a changeset bumps only what it names plus its dependents. **While
`di` is on 0.x, a breaking change is a `minor`** — a `major` is a deliberate 1.0 for this package alone. Whether the
repo is currently in canary pre-release mode is a thing to read, not to remember (`test -f .changeset/pre.json`),
because it flips either way; use the `release` skill for the publish flow.

## Full gate before commit / PR

```bash
pnpm verify   # build:packages + lint:fix + format + check-types + test:coverage
```

## Commit

Conventional Commits (commitlint-enforced). If you are on `main`, branch first. Update this package's README/docs when
the public API changes — and leave `@since` to CI.

---

### Fast path for a resolver tweak

`edit resolution/resolver.ts` → `build` → `test:unit` → `bench:isolate` (guard regressions) → `pnpm verify` →
`changeset` → commit.

## License

Released under the [MIT License](./LICENSE).
