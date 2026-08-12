# Contributing to CodeFast

Thanks for helping out. This file covers the repo-wide workflow; `@codefast/di` has its own stricter checklist at
[packages/di/CONTRIBUTING.md](packages/di/CONTRIBUTING.md), and the full set of conventions lives in
[CLAUDE.md](CLAUDE.md).

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

CodeFast stays on **0.x** with no 1.0 planned — breaking changes ship as minor versions, which is what keeps them cheap
enough to make. The API surface never "locks", so feedback on a name or a shape is worth raising whenever you hit it.

## The toolchain is non-standard — read this first

Four things routinely surprise newcomers:

- **Lint and format are [Oxc](https://oxc.rs), not ESLint/Prettier.** `oxlint` (with type-aware rules) and `oxfmt`.
  `oxlint` runs with `--deny-warnings`, so a warning fails CI.
- **One TypeScript: native [TypeScript 7](https://www.typescriptlang.org)** (`tsc`, the Go port), used for both
  type-checking and package builds.
- **`packages/*` have no bundler.** `tsc` emits per-file `.js` + `.d.ts` to `dist/`. Vite (Rolldown) is reserved for
  genuine browser bundles (`apps/ui`, `examples/*`, the benchmark viewer's browser lane).
- **`exactOptionalPropertyTypes` is on.** An optional prop that may receive an explicit value is typed
  `?: T | undefined`.

## Setup

Node ≥ 24 (≥ 26 to work on `@codefast/di`, which uses native `Map.prototype.getOrInsert` and `getOrInsertComputed`),
pnpm 11 — pinned via `packageManager`.

```bash
git clone https://github.com/codefastlabs/codefast.git
cd codefast
pnpm install
pnpm build:packages
```

`pnpm build:packages` is required before running apps, type-checking, or type-aware lint: `@codefast/ui` consumes other
packages' built `dist/`, and Oxlint's type-aware rules need them too. Run it again after editing any package source.

## Writing the change

- **Internal imports use Node subpath imports** declared in each package's `package.json#imports` —
  `#/components/button`, `#/tests/...`. Do not add `compilerOptions.paths` for internal aliases.
- Keep `import type` separate from value imports.
- **`package.json#exports` is generated** from `dist/` by `codefast mirror`, never hand-edited. Regenerate it after
  adding, moving, or renaming a module:

  ```bash
  pnpm --filter <package> build   # mirror reads dist/, so build first
  pnpm cli:mirror:preview        # review the exports diff
  pnpm cli:mirror                # write it
  ```

- **No speculative features.** Every new public API needs a real call site.

### Comments are TSDoc, and short

One plain-English line stating the _why_; three lines is the hard cap. Never restate what the code does, and never put
types in comments — TS already declares them.

Three rules the linter cannot enforce:

- **No numbers in source comments** — no benchmark figures, percentages, or byte counts. They cannot be re-verified
  where they sit and go stale silently. Numbers live with their method, in `ARCHITECTURE.md` or `RESULTS.md`.
- **No history** — no "used to", "previously", "the old threshold". Git carries that.
- **Never hand-write an `@since` tag.** `codefast tag` stamps it at release. Existing exports all carry one, so a new
  export looks unfinished without it; the absence is correct. Check your diff:
  `git diff --cached | grep -E '^\+.*@since'` — any hit is a bug.

### Naming public API

Audit every exported function, type, prop, option, and config key against the
[Swift-style rubric in CLAUDE.md](CLAUDE.md#api-naming-swift-api-design-guidelines-adapted-to-ts). The short version:
name by role and never lie about it, properties are nouns, side-effecting functions are imperative verbs, hooks take
`XxxOptions` and return `XxxResult` (`Props` is for components only), and names locked by an upstream contract stay
verbatim.

## Tests

Every test file lives under exactly one category directory, or Vitest will not discover it — there is no implicit
bucket. Mirror the `src/` path inside the category: `src/utils/dom.ts` → `tests/unit/utils/dom.test.ts`. No tests under
`src/`. See [TESTING.md](TESTING.md).

| Directory              | Scope                                          |
| ---------------------- | ---------------------------------------------- |
| `tests/unit/**`        | Isolated, mocks allowed — most tests           |
| `tests/integration/**` | Multiple modules in-process, in-memory/temp IO |
| `tests/e2e/**`         | Subprocesses, built binaries, real network     |
| `tests/types/**`       | Static `expectTypeOf` tests                    |

```bash
pnpm --filter @codefast/ui test:unit
pnpm --filter @codefast/ui exec vitest run tests/unit/path/to.test.ts -t "name"
```

## Performance changes

A refactor on a hot path is not free until measured. Run the head-to-head suite with process isolation so the numbers
are order-independent:

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

The rules that make a result publishable — learned the hard way, and enforced on ourselves:

- **Compare against a baseline stashed and rebuilt on the same machine**, not numbers from an earlier session.
- **At least 3 trials per side**, and compare the **best** of each rather than one median. Ambient load only ever
  subtracts throughput, and a single run cannot separate a 5% change from noise.
- **Measure each library in its own process.** Loading two library builds into one process is worth ~30% on async
  chains.
- **Cite the aggregates** (median, geomean across the suite). Individual high-throughput rows move between runs whatever
  their IQR says.
- **Measure cold paths too.** Container construction and registration are invisible to the hot loops and have been the
  source of the suite's real losses.
- **Validate a hypothesis by throwaway ablation, not by reasoning.** Build the variant, measure it, delete it.
- **A claim gets retracted when a better measurement disagrees with it.** `RESULTS.md` has retracted one; that is the
  standard, not an embarrassment.

For anything material, run the publishable profile and update `RESULTS.md`:

```bash
BENCH_MODE=full BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

`bench:isolate` runs **scenario-major and interleaved** — every library measures a scenario before the next one starts,
rotating who goes first — so drift over the run no longer lands on whoever was scheduled last. The report states the
policy it used. Without `bench:isolate` there is one process per library and nothing to interleave, so a cross-library
ratio from that profile stays provisional; see
[`benchmarks/di-inversify/BENCH_GUIDE.md`](benchmarks/di-inversify/BENCH_GUIDE.md).

## Changesets

Add one whenever a published package changes:

```bash
pnpm exec changeset
```

All `@codefast/*` are a single `fixed` group and version together at the **highest** bump any changeset requests.
**While on 0.x, never author a `major`** — one major on one package would bump the whole group to 1.0.0. Breaking
changes are `minor` during 0.x.

Versioning and publishing are owned by CI; do not run the release commands locally.

## The gate before you open a PR

```bash
pnpm verify   # build:packages + lint:fix + format + check-types + test:coverage
```

`pnpm check` is the faster, fix-free subset (lint + format:check + check-types). If you edited files via a script rather
than an editor, run `pnpm format` and `pnpm lint:fix` by hand — this repo has no post-write formatting hook.

Changed a public API surface? Verify the **production** build of a consumer, not just `dev` — client import-protection
and prerendering only surface at build time:

```bash
pnpm build:packages && pnpm --filter @apps/ui build
```

## Commits and pull requests

- **[Conventional Commits](https://www.conventionalcommits.org/)**, enforced by commitlint. Scope by package:
  `fix(ui): …`, `perf(di): …`.
- Branch first — do not commit to `main`.
- Group unrelated changes into separate commits.
- In the PR description, say what you measured or ran, not just what you changed. A perf claim needs its numbers and the
  command that produced them.

## Reporting problems

- **Bugs and performance regressions:** use the
  [issue templates](https://github.com/codefastlabs/codefast/issues/new/choose).
- **Questions and API feedback:** [Discussions](https://github.com/codefastlabs/codefast/discussions).
- **Security vulnerabilities:** privately, per [SECURITY.md](SECURITY.md) — never a public issue.

## License

Contributions are accepted under the repository's [MIT license](LICENSE).
