# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CodeFast is a **pnpm workspaces + Turborepo** monorepo (Node ≥ 24, pnpm 11.8.0) publishing the `@codefast/*` packages. The flagship is `@codefast/ui`, a Radix-based, Tailwind CSS 4 component library. `apps/ui` is a TanStack Start showcase site that consumes the packages.

## Toolchain (non-standard — read before assuming)

- **Lint/format is Oxc, not ESLint/Prettier.** `oxlint` (with type-aware rules via `oxlint-tsgolint`) and `oxfmt`. `oxlint` runs with `--deny-warnings`.
- **Type checking uses `tsgo --noEmit`** (TypeScript Native / `@typescript/native-preview`), not `tsc`.
- **Bundling is `tsdown`** (Rolldown-based), configured per package via `tsdown.config.ts`.
- **`exactOptionalPropertyTypes` is enabled** — an optional prop that may receive an explicit value must be typed `?: T | undefined`.

## Commands

Build packages before running apps, type-checking, or type-aware lint — `@codefast/ui` consumes other packages' built `dist/` and Oxlint's type-aware rules need them.

```bash
pnpm build:packages   # build only packages/* (run after editing any package src)
pnpm dev              # build packages, then start all apps + packages in watch mode
pnpm check-types      # tsgo type check across the repo (no auto-fix — fix by hand)
pnpm check            # lint + format:check + check-types (static gate, no fixes)
pnpm check:fix        # lint --fix + format write
pnpm verify           # full gate: build:packages + lint:fix + format + check-types + test:coverage
```

After editing files via **Bash** (codegen, scripts, the `codefast` CLI), run `pnpm format` and `pnpm lint:fix` manually — there is no PostToolUse formatting hook in this repo.

### Tests

Run a single package's tests with `--filter`, scoped by category:

```bash
pnpm --filter @codefast/ui test:unit          # one package, one category
pnpm --filter @codefast/ui test:watch         # interactive watch
pnpm test:unit                                # all packages, unit only (Turbo)
```

A single test file / name (within a package): `pnpm --filter @codefast/ui exec vitest run tests/unit/path/to.test.ts -t "name"`.

## Test taxonomy (enforced — see TESTING.md)

Every test file lives under exactly one category directory; otherwise Vitest will not discover it. There is no implicit bucket.

- `tests/unit/**` — isolated, mocks allowed (most tests)
- `tests/integration/**` — multiple modules in-process, in-memory/temp I/O only
- `tests/e2e/**` — subprocesses, built CLI binary, real network
- `tests/types/**` — static `expectTypeOf` tests

Rules: **no tests under `src/**`**; no test files directly under `tests/`(must be in a category subdir); mirror the`src/` path inside the category (`src/utils/dom.ts`→`tests/unit/utils/dom.test.ts`). Helpers/fixtures go under `tests/<category>/support/**`or`.../fixtures/**`and must not match`_.test._`.

## Imports & aliases

- Internal imports use **Node subpath imports** declared in each package's `package.json#imports` — e.g. `#/components/button` for src, `#/tests/...` for test helpers. Do **not** add `compilerOptions.paths` for internal aliases (reserve TS path mapping for external-compat needs only).
- Keep `import type` separate — never merge type imports into value imports.

## Comments (TSDoc, not JSDoc)

This is a **TypeScript** project, so doc comments are **TSDoc** — never JSDoc type syntax. The bar: **explain _why_, never restate _what_; let the types carry the types.**

- **Never put types in comments.** No `@param {string} x` / `@returns {T}` — TS already declares them, and a duplicated type just goes stale. Prefer omitting `@param`/`@returns` entirely. Add `@param name - …` (TSDoc style: a hyphen, **no** `{type}`) or `@typeParam T - …` only to document a non-obvious _meaning_ — units, an invariant, ownership — not the type.
- **`//` comments explain the _why_** — a non-obvious decision, constraint, trade-off, or gotcha (e.g. `// scoped to the client env — the nitro build sets its own codeSplitting`). If a competent reader could infer it from the code or the types, **delete it**. Match the surrounding comment density; don't narrate obvious lines.
- **A doc comment on an exported symbol** leads with a one-line summary of intent/purpose (what it's _for_, not how it works). Internal helpers get a comment only when non-obvious.
- **TSDoc block tags only when they add what the type can't:** `@remarks` (detail past the summary), `@example`, `@deprecated <reason + replacement>`, `@see`, `@throws`, `@defaultValue`.
- **`@since <version>` is generated** by `codefast tag` at release — never hand-write it.
- No commented-out code left behind; a `TODO`/`FIXME` must state why or link an issue.

## Packages

| Path                         | Role                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/ui`                | `@codefast/ui` — Radix + Tailwind component library; per-component subpath exports (`./button`, etc.)  |
| `packages/tailwind-variants` | Type-safe variant styling API (faster `tailwind-variants` replacement); used by `ui`                   |
| `packages/theme`             | Theme management using React 19 features (optimistic updates, cross-tab sync)                          |
| `packages/di`                | Lightweight dependency-injection primitives                                                            |
| `packages/cli`               | `codefast` CLI — subcommands `arrange`, `mirror`, `tag` (run via `pnpm run codefast <cmd>`)            |
| `packages/typescript-config` | Shared tsconfig presets                                                                                |
| `packages/benchmark-*`       | Performance benchmark harness/viewer (`pnpm bench`)                                                    |
| `apps/ui`                    | Docs/showcase site for `@codefast/ui` (TanStack Start); consumes `packages/*` via `workspace:*`        |
| `examples/tanstack-start`    | Consumer smoke-test: installs the **published** `@codefast/*` from npm (via catalog) on TanStack Start |

## UI/component conventions (apps/ui and packages/ui)

These are project rules the linters do not fully enforce:

- **No Tailwind-classes-in-a-variable** (`const FOO = "flex gap-3"`) — it loses IntelliSense/auto-sort. Write classes inline in `className`. When a class set repeats, extract a **reusable component**, not a string constant. Conditional classes use `cn()` inline. CSS effects (gradient/mask/background-size) use Tailwind arbitrary values (`bg-[radial-gradient(...)]`), not `style` objects.
- **One component per file** under `apps/ui/src/components/**`. Extract sub-components/helpers into their own kebab-case file and import. Accepted co-location exceptions: icon sets, and `*.example.tsx` / `demo.tsx` under `registry/`.
- **No inline prop types.** Declare `interface XxxProps extends ComponentProps<"element">` (matching the host element rendered), spread `{...props}` **last** on that element, and merge classes via `cn(base, className)`. `Omit` any attr the wrapper hard-sets. When forwarding to another component (not a DOM element), extend `ComponentProps<typeof ThatComponent>` and `Omit` the required props the wrapper supplies. Exception: a handler the component must own (e.g. a `CopyButton`'s `onClick`) goes _after_ `{...props}` with a comment.

## Releases

Versioning is via **Changesets**. The repo is currently in **canary pre-release mode** (`.changeset/pre.json`, `mode: "pre"`). Use the `release` skill for the full publish workflow; `release:canary:exit` leaves pre mode. Commits follow **Conventional Commits** (enforced by commitlint).
