# Testing taxonomy

This monorepo uses **four explicit test categories**. Every test file in
`packages/*/tests/**` and `apps/*/tests/**` MUST live under exactly one category
directory, otherwise it will not be discovered by Vitest. There is no implicit
"leftover" bucket.

## Categories

| Category        | Folder                 | What goes here                                                                                                                            | Typical environment |
| --------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Unit**        | `tests/unit/**`        | Fast, isolated tests for a single module/function/component. Heavy mocks allowed. Most tests live here.                                   | `node` / `jsdom`    |
| **Integration** | `tests/integration/**` | Multiple modules wired together inside one process. Real I/O against in-memory or temp resources. No subprocesses, no real network.       | `node` / `jsdom`    |
| **E2E**         | `tests/e2e/**`         | End-to-end: spawns subprocesses, exercises the built CLI binary, real network/HTTP, cross-process behavior.                               | `node`              |
| **Type**        | `tests/types/**`       | Static type-only tests using `expectTypeOf` / `expect-type`. Validates public type surface; runtime assertions are a side-effect at most. | `node`              |

### E2E flavors (same folder name, different runners)

The `tests/e2e/**` directory is shared by two flavors — pick the right mental
model when writing or reviewing tests:

| Flavor                | Where                                 | What it actually drives                                                                                                     |
| --------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **CLI / package e2e** | `packages/*/tests/e2e/**`             | Subprocesses, built binaries, Node-only Vitest. This is what root `pnpm test:e2e` (Turbo) primarily fans out.               |
| **Storybook browser** | `@codefast/ui` coverage / story tests | Playwright Chromium for Storybook stories — **not** under `tests/e2e/**`; lives in the package's Storybook/browser project. |

### Test helper placement (NOT executed as tests)

Helpers and fixtures must be scoped under a category directory, such as:

- `tests/unit/support/**`, `tests/integration/support/**`,
  `tests/e2e/support/**`, `tests/types/support/**`
- `tests/unit/fixtures/**`, `tests/integration/fixtures/**`,
  `tests/e2e/fixtures/**`, `tests/types/fixtures/**`

Helper files MUST NOT match `*.test.*` / `*.spec.*` filenames.

## Hard rules

1. **No tests under `src/**`.** Forbidden filename patterns inside `src/\*_`:
   `_.test._`, `_.spec._`, `_.bench._`, `_.test-helper.\*`, and any
   `**tests**/` directory.
2. **No test files directly under `tests/`** — they MUST live inside a known
   category sub-directory.
3. **No unknown category directories.** If a test lives under
   `tests/something-else/**` it will be reported as miscategorized.
4. **Keep helper directories category-scoped.** Do not create top-level
   helper categories such as `tests/support/**` or `tests/fixtures/**`;
   place helpers under a valid category path (for example,
   `tests/unit/support/**`).

These rules are project conventions and should be validated as part of normal
CI/local verification.

## File naming

- Test files: `*.test.ts` / `*.test.tsx` / `*.test.cts` / `*.test.mts` /
  `*.test.js` / `*.test.jsx` / `*.test.cjs` / `*.test.mjs` (and the `.spec.`
  variants — discouraged but accepted by the guardrail).
- Mirror the `src/` path inside the category. Example:
  `src/utils/dom.ts` → `tests/unit/utils/dom.test.ts`.
- Integration tests describing a multi-module flow may use a flow-oriented
  filename instead of a 1:1 mirror, e.g.
  `tests/integration/decorators.integration.test.ts`.

## Per-package scripts

Every package **and app** that ships a `vitest.config.ts` exposes the same
script surface (empty categories pass via `passWithNoTests: true`):

```sh
pnpm --filter <pkg> test               # run every category
pnpm --filter <pkg> test:unit          # tests/unit/**
pnpm --filter <pkg> test:integration   # tests/integration/**
pnpm --filter <pkg> test:e2e           # tests/e2e/**
pnpm --filter <pkg> test:type          # tests/types/**
pnpm --filter <pkg> test:coverage      # coverage (apps/ui: unit project only)
pnpm --filter <pkg> test:watch         # interactive watch mode
```

Aggregate (root) commands run the same task across all packages and apps via
Turbo:

```sh
pnpm test                  # all categories, all packages + apps
pnpm test:unit             # unit only, all packages + apps
pnpm test:integration      # integration only, all packages + apps
pnpm test:e2e              # e2e only, all packages + apps (Turbo fan-out — slow)
pnpm test:type             # type-only tests, all packages + apps
pnpm test:coverage         # full coverage, all packages + apps
```

### CI honesty

- **Packages gate** (`.github/workflows/reusable-verify-packages.yml`): build +
  lint/format/types + `test:coverage` for `./packages/**` only. Installs
  Playwright Chromium for `@codefast/ui` Storybook browser tests inside that
  coverage run. Does **not** start `apps/ui`.

Root `pnpm test:e2e` runs every package that defines the script — use it for
full-repo gates.

## Today's coverage (snapshot)

| Package / app                 | unit | integration |                e2e                 | type |
| ----------------------------- | :--: | :---------: | :--------------------------------: | :--: |
| `@apps/ui`                    | yes  |     yes     |                 —                  |  —   |
| `@codefast/benchmark-harness` | yes  |      —      |                 —                  |  —   |
| `@codefast/cli`               | yes  |      —      |                 —                  |  —   |
| `@codefast/di`                | yes  |     yes     |                 —                  |  —   |
| `@codefast/tailwind-variants` | yes  |      —      |                 —                  | yes  |
| `@codefast/theme`             | yes  |      —      |                 —                  |  —   |
| `@codefast/ui`                | yes  |      —      | — (Storybook browser via coverage) |  —   |

Categories without tests are still **wired into the Vitest include glob and
into the package scripts** so adding the first test in a new category is
purely additive — no config or script change needed.

## Adding a new test

1. Decide the category (unit / integration / e2e / type).
2. Place the file under `tests/<category>/<mirrored path>.test.ts`.
3. Use `#/...` aliases for production imports and `#/tests/...` for helpers.
4. Run `pnpm --filter <pkg> test:<category>` locally.
5. Run `pnpm verify` before pushing (packages).
