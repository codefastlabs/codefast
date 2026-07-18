# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CodeFast is a **pnpm workspaces + Turborepo** monorepo (Node ≥ 24, pnpm 11; `@codefast/di` alone requires Node ≥ 26 for native `Map.prototype.getOrInsert`) publishing the `@codefast/*` packages. The flagship is `@codefast/ui`, a Radix-based, Tailwind CSS 4 component library. `apps/ui` is a TanStack Start showcase site that consumes the packages.

## Toolchain (non-standard — read before assuming)

- **Lint/format is Oxc, not ESLint/Prettier.** `oxlint` (with type-aware rules via `oxlint-tsgolint`) and `oxfmt`. `oxlint` runs with `--deny-warnings`.
- **Type checking uses the native `tsc --noEmit`** from **TypeScript 7** (the Go port), installed under the `@typescript/native` catalog alias (`npm:typescript@7`). The plain `typescript` dependency is aliased to `@typescript/typescript6` (the JS compiler, bin `tsc6`) — kept because tsdown/`rolldown-plugin-dts` and the TanStack plugins consume the classic TS compiler API. TS 7's `.` export is only `{ version }` (the compiler API lives under the new `./unstable/*` surface); pointing `typescript` at 7.x crashes `rolldown-plugin-dts` dts-gen (`ts.sys` is `undefined`) — verified on both 7.0.2 and 7.1-dev, so this is _not_ fixed by bumping the TS version. **The trigger to drop `@typescript/typescript6` is `rolldown-plugin-dts`/tsdown (and the TanStack plugins) migrating to the `typescript/unstable` API**, not a TS release number. When that lands, point the `typescript` alias at `npm:typescript@7` and collapse the two catalog entries into one.
- **Bundling is `tsdown`** (Rolldown-based), configured per package via `tsdown.config.ts`.
- **`exactOptionalPropertyTypes` is enabled** — an optional prop that may receive an explicit value must be typed `?: T | undefined`.

## Fast-moving dependencies (verify, don't recall)

`react`, `@tanstack/react-start`/`@tanstack/react-router`, `zod`, and `typescript` are this repo's backbone and are kept pinned at or near latest (see `pnpm-workspace.yaml` catalog) — an LLM's trained knowledge of their APIs can be stale, especially for TanStack Start, which is still pre-1.0 and changes fast. Before asserting an API is current/deprecated/missing, or that a pattern is outdated, verify against the actually-installed version instead of relying on trained knowledge:

- Read the pinned version from `pnpm-workspace.yaml`, not from memory.
- `npm view <pkg> version` to check the pin against the latest published release.
- Read the real `.d.ts`/source under `node_modules/.pnpm/<pkg>@<version>/...` to confirm an API's current shape.
- Search changelogs/migration guides only when the installed source doesn't clarify _why_ a pattern exists, not just _whether_ an API exists.

### TanStack Start — ground on the docs, then verify against the PRODUCTION build

TanStack Start is where trained knowledge is most likely wrong. Before writing or reviewing any Start code (`createServerFn`, `createMiddleware`, `createStart`, server routes, loaders, request/response access), ground yourself in this order — never write from memory:

1. **Read the doc map at `https://tanstack.com/start/latest/llms.txt`** and fetch the specific `.md` pages it lists (`.../guide/server-functions.md`, `.../guide/server-routes.md`, `.../guide/middleware.md`). The rendered docs are a client SPA — a plain `WebFetch` of the HTML returns an empty shell; the `.md` URLs are static and fetchable.
2. **Confirm the installed version's real shape** in `node_modules/.pnpm/@tanstack+*/...` — the pin can lag `latest` (e.g. `createServerFn().validator()` is what compiles here; `getRequestHeader`/`getRequest`/`setResponseHeader` come from `@tanstack/react-start/server`).
3. **Verify against the real `vite build`, not just `dev` + `check-types`.** `pnpm --filter @apps/ui build`. Dev SSRs every request and hides two things that only surface in prod: **(a)** client import-protection denies any client-reachable import of `**/*.server.*` (don't put a `createServerFn` module behind a `.server.` filename the client imports); **(b)** the build **prerenders**, so a route `loader` runs at **build time**, not per visitor.

**The load-bearing deployment fact — `apps/ui` ships to Vercel as ISR/prerender.** The served HTML is **cached and shared across visitors**, so per-visitor data (geo → region consent) MUST come from a **client request to a server function**: Vercel injects `x-vercel-ip-country` on that request, so the fn resolves the real region. A root-route **SSR loader is wrong here** — it resolves at build/regen and bakes one visitor-independent value (the strictest default) into the cached HTML for everyone. This is exactly why `packages/tracking` resolves initial consent via a **client round-trip** (`resolveVisitorConsent`, session-cached) over a strictest-baked HTML shell — the correct idiom for this stack. An SSR loader would only be right for per-request SSR with no CDN cache. Still-true mechanism fact: a request middleware's `next({ context })` does **not** reach a route `beforeLoad` or the component tree (`beforeLoad` re-runs client-side). Use server routes (`createFileRoute(path)({ server: { handlers } })`, explicit `Request`→`Response`) for HTTP endpoints — see `packages/tracking/spec/` for the behavioral contract.

## Commands

Build packages before running apps, type-checking, or type-aware lint — `@codefast/ui` consumes other packages' built `dist/` and Oxlint's type-aware rules need them.

```bash
pnpm build:packages   # build only packages/* (run after editing any package src)
pnpm dev              # start all apps + packages in watch mode (no upfront build — run build:packages once on a fresh clone)
pnpm check-types      # native tsc --noEmit type check across the repo (no auto-fix — fix by hand)
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

Rules: **no tests under** `src/**`; no test files directly under `tests/` (must be in a category subdir); mirror the `src/` path inside the category (`src/utils/dom.ts` → `tests/unit/utils/dom.test.ts`). Helpers/fixtures go under `tests/<category>/support/**` or `.../fixtures/**` and must not match `*.test.*`.

## Imports & aliases

- Internal imports use **Node subpath imports** declared in each package's `package.json#imports` — e.g. `#/components/button` for src, `#/tests/...` for test helpers. Do **not** add `compilerOptions.paths` for internal aliases (reserve TS path mapping for external-compat needs only).
- Keep `import type` separate — never merge type imports into value imports.

## Comments (TSDoc, not JSDoc)

This is a **TypeScript** project, so doc comments are **TSDoc** — never JSDoc type syntax. The bar: **keep comments concise — one short, plain-English line per point; state the _why_/purpose, never restate _what_, and let the types carry the types.**

- **Concise above all.** Prefer a single short line stating a block's purpose over a multi-line rationale essay. Don't pile up trade-offs, alternatives-considered, or tool internals in code comments — keep it brief, or move that detail to the PR/commit. One line saying _why this is here_ beats five that re-explain the code.
- **Never put types in comments.** No `@param {string} x` / `@returns {T}` — TS already declares them, and a duplicated type just goes stale. Prefer omitting `@param`/`@returns` entirely. Add `@param name - …` (TSDoc style: a hyphen, **no** `{type}`) or `@typeParam T - …` only to document a non-obvious _meaning_ — units, an invariant, ownership — not the type.
- **`//` comments state the _why_/purpose in one line** — a non-obvious decision, constraint, or gotcha (e.g. `// scoped to the client env — the nitro build sets its own codeSplitting`). If a competent reader could infer it from the code or the types, **delete it**; never narrate obvious lines.
- **A doc comment on an exported symbol** leads with a one-line summary of intent/purpose (what it's _for_, not how it works). Internal helpers get a comment only when non-obvious.
- **TSDoc block tags only when they add what the type can't:** `@remarks` (detail past the summary), `@example`, `@deprecated <reason + replacement>`, `@see`, `@throws`, `@defaultValue`.
- **Speak the API's vocabulary (Apple HIG terms).** In comments and names, **appearance** is the user's preference (Light / Dark / Auto) and **color scheme** is the resolved light/dark value applied — say "appearance" for the preference, "color scheme" for the resolved value, and avoid the legacy "theme" wording. Prefer `/** … */` doc blocks over `//` lines when the comment documents intent.
- **`@since <version>` is generated** by `codefast tag` at release — never hand-write it, and never remove a released one (the add-only tool would re-stamp it with the current version, destroying the true original).
- No commented-out code left behind; a `TODO`/`FIXME` must state why or link an issue.

## API naming (Swift API Design Guidelines, adapted to TS)

Audit every public API you add or touch (exported function/type/prop/option/config key) against these — clarity at the point of use beats brevity, and every word must convey information:

- **Name by role, never lie.** A name must state what the thing actually does (`options` for a hard selection criterion, never `hint`; a render function is `renderX`, never `customLabel`). No filler suffixes — `Type` on a type alias says nothing (`AppearanceContextValue`, not `AppearanceContextType`).
- **Properties/types are nouns** (`delivery: "immediate"`, not `deliver`); **side-effecting functions are imperative verbs** (`track`, `flush`); handlers are `onX`.
- **Booleans read as assertions** (`animated`, `isScrollAnchor`, `isTrackingAllowed`), or as conventional option-bag instructions (`trackPageViews`, `includeAds`) when they configure behavior.
- **Hooks take `XxxOptions` and return `XxxResult`** — `Props` is for components only.
- **Compensate weak types with units/role in the name**: `sizeInPixels`, `retryDelayMs`.
- **Precedent beats the rulebook.** Names locked by JS/React/Radix/upstream contracts (`opts` on Carousel, `tv`/`twMerge`, Recharts' `initialDimension`, `create*` factories, `use*` hooks) stay verbatim — renaming a passthrough breaks the compatibility that makes it valuable.
- When renaming for these rules, watch for **shadowing**: a mass rename that collides with an existing local (`const options = options === undefined …`) is a TDZ bug the type checker and tests must catch before commit.

## Packages

| Path                         | Role                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| `packages/ui`                | `@codefast/ui` — Radix + Tailwind component library; per-component subpath exports (`./button`, etc.)  |
| `packages/tailwind-variants` | Type-safe variant styling API (faster `tailwind-variants` replacement); used by `ui`                   |
| `packages/theme`             | Theme management using React 19 features (optimistic updates, cross-tab sync)                          |
| `packages/di`                | Lightweight dependency-injection primitives (requires Node ≥ 26)                                       |
| `packages/tracking`          | Consent-gated, type-safe event tracking for TanStack Start over a Standard Schema event catalog        |
| `packages/cli`               | `codefast` CLI — subcommands `arrange`, `audit`, `mirror`, `tag` (run via `pnpm run codefast <cmd>`)   |
| `packages/typescript-config` | Shared tsconfig presets                                                                                |
| `packages/benchmark-*`       | Performance benchmark harness/viewer (`pnpm bench`)                                                    |
| `benchmarks/*`               | Benchmark suites comparing `@codefast/*` against upstream (`di-inversify`, `tailwind-variants`)        |
| `apps/ui`                    | Docs/showcase site for `@codefast/ui` (TanStack Start); consumes `packages/*` via `workspace:*`        |
| `examples/tanstack-start`    | Consumer smoke-test: installs the **published** `@codefast/*` from npm (via catalog) on TanStack Start |

## UI/component conventions (apps/ui and packages/ui)

These are project rules the linters do not fully enforce:

- **No Tailwind-classes-in-a-variable** (`const FOO = "flex gap-3"`) — it loses IntelliSense/auto-sort. Write classes inline in `className`. When a class set repeats, extract a **reusable component**, not a string constant. Conditional classes use `cn()` inline. CSS effects (gradient/mask/background-size) use Tailwind arbitrary values (`bg-[radial-gradient(...)]`), not `style` objects.
- **One component per file** under `apps/ui/src/components/**`. Extract sub-components/helpers into their own kebab-case file and import. Accepted co-location exceptions: icon sets, and `*.example.tsx` / `demo.tsx` under `registry/`.
- **No inline prop types.** Declare `interface XxxProps extends ComponentProps<"element">` (matching the host element rendered), spread `{...props}` **last** on that element, and merge classes via `cn(base, className)`. `Omit` any attr the wrapper hard-sets. When forwarding to another component (not a DOM element), extend `ComponentProps<typeof ThatComponent>` and `Omit` the required props the wrapper supplies. Exception: a handler the component must own (e.g. a `CopyButton`'s `onClick`) goes _after_ `{...props}` with a comment.
- **RTL: keep physical classes that sit under a side variant.** `packages/ui` is RTL-hardened with logical utilities + `rtl:` overrides, but physical `left-/right-/border-l/r/slide-in-from-*` classes gated behind `data-[side=…]` (or the custom `data-side-left`/`data-side-right`) are intentional — Radix resolves `side` per reading direction, so converting them to logical double-flips. Run `pnpm --filter @codefast/ui audit:rtl` to check for genuine gaps.

## Releases

Versioning is via **Changesets**. The repo is currently in **canary pre-release mode** (`.changeset/pre.json`, `mode: "pre"`). Use the `release` skill for the full publish workflow; `release:canary:exit` leaves pre mode. Commits follow **Conventional Commits** (enforced by commitlint).
