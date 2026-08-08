# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CodeFast is a **pnpm workspaces + Turborepo** monorepo (Node ≥ 24, pnpm 11; `@codefast/di` alone requires Node ≥ 26 for native `Map.prototype.getOrInsert`/`getOrInsertComputed`) publishing the `@codefast/*` packages. The flagship is `@codefast/ui`, a Radix-based, Tailwind CSS 4 component library. `apps/ui` is a TanStack Start showcase site that consumes the packages.

## Toolchain (non-standard — read before assuming)

- **Lint/format is Oxc, not ESLint/Prettier.** `oxlint` (with type-aware rules via `oxlint-tsgolint`) and `oxfmt`. `oxlint` runs with `--deny-warnings`.
- **One TypeScript, and it is native TypeScript 7** (`tsc`, the Go port) — a single catalog entry `typescript: ^7.0.2`, used for **both** type-checking (`tsc --noEmit`) and package builds. TS 7 emits `.js` + `.d.ts`, so every `packages/*` builds with plain `tsc` (no bundler — see below). There is no `@typescript/native` alias and no classic `@typescript/typescript6` anymore: `@codefast/cli` — the only place that needed the classic compiler API — now parses TypeScript with **`oxc-parser`** (its `arrange`/`tag` AST tooling), so nothing in the repo depends on the classic `typescript` runtime. (TanStack Start's Vite plugins build fine on TS 7 — verified.)
- **Library and bin packages build with native `tsc`** — per-package `tsconfig.build.json`, the Turborepo "Compiled Packages" model, emitting per-file `.js` + `.d.ts` to `dist/`. tsc leaves internal `#/` subpath imports verbatim, so each `package.json#imports` is conditional (`source` → `src` for dev/tests, `types`/`default` → `dist` for consumers), and `apps/ui` consumes the built `dist/`. Exports are generated from `dist/` by `codefast mirror`. The **only** bundler is **Vite** (Rolldown), reserved for genuine browser bundles: `apps/ui`/`examples` (TanStack Start) and the `benchmark-viewer` browser app (its Node/SSR lane is plain tsc).
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
- **`tsc` resolves `#/` through the `imports` field itself, so no `tsconfig` under `packages/*`, `apps/*`, or `examples/*` declares `paths`** — and neither Vite nor Vitest needs `resolve.tsconfigPaths`. Two requirements make that work: every `#/*` target lists its extension candidates (`./src/*`, `./src/*.ts`, `./src/*.tsx`, `./src/*/index.ts`, `./src/*/index.tsx`) because `tsc` does no extension substitution on a bare `"./src/*"`; and each `packages/*` tsconfig sets `"customConditions": ["source"]` to pick the `src` lane, since TS's default conditions (`import`, `types`) match the `types` lane and would silently type-check `src/` against stale `dist/*.d.ts`. Keep `./src/*` first in the array — `#/styles.css?url` resolves on that candidate alone. That condition also makes cross-package imports (`@codefast/ui` → `@codefast/tailwind-variants`) resolve to the other package's `src`, so `check-types` no longer needs a prior build; `apps/*`, `examples/*`, and `benchmarks/*` set no custom condition and keep consuming the built `dist/`. Every runner in the repo now resolves `#/` the same way — `tsc`, Vite, Vitest, and `tsx` (the benchmarks) all read the `imports` field, so `paths` exists nowhere.
- **The three conditions are three audiences, not three spellings of one path.** `tsc` emits `#/` specifiers verbatim into both `.d.ts` and `.js`, so the field keeps resolving after the package leaves this repo: `source` → `./src/*` is you during dev; `types` → `./dist/*.d.ts` is a **consumer's** `tsc` resolving a `#/` it found inside your shipped declarations; `default` → `./dist/*.js` is a **consumer's** Node resolving a `#/` it found inside your shipped JS. Never repoint the two `dist` lanes at `src` — that hands consumers unbuilt source to type-check and execute, and it only appears to work because `files` still ships `src`. Confirm a lane with `tsc --noEmit --traceResolution | grep "'#/…'"`, which prints the condition it matched.
- **A fallback array belongs only in a lane no real Node reads.** Node takes the first array entry it can parse, never checks that the file exists, and never falls through — so `["./dist/*.js", "./dist/*/index.js"]` is a safety net that cannot fire, and a missing first candidate throws `ERR_MODULE_NOT_FOUND` instead of trying the second. The `source` lane keeps its extension candidates because only `tsc` and Vite read it and both probe; `types` and `default` are single strings. `apps/*` and `examples/*` may keep a bare array because nothing but `tsc`/Vite/Vitest reads it — the one exception is `vite.config.ts`, which Vite externalises so raw Node resolves it, hence its `#/lib/cache.ts` import spells the extension to hit the first candidate exactly.
- **The condition is named `source` deliberately — do not "standardise" it to `development`.** Vite and webpack both enable `development` on their own in dev mode, so a published package would hand every consumer its raw `.tsx`: `next dev` answers 500 (`Unknown module type`) while `next build` stays green, and the fix — `transpilePackages` — is theirs to discover. Nothing enables `source` unless asked, which is the whole point.
- Keep `import type` separate — never merge type imports into value imports.

## Comments (TSDoc, not JSDoc)

This is a **TypeScript** project, so doc comments are **TSDoc** — never JSDoc type syntax. The bar: **keep comments concise — one short, plain-English line per point; state the _why_/purpose, never restate _what_, and let the types carry the types.**

- **Three lines is the cap.** One short line stating a block's purpose; three at the absolute most. A comment that wants more is telling you the detail belongs in the package's `ARCHITECTURE.md` (or the PR) — put the argument there, and state the _invariant itself_ here in one line. "Be concise" is not enforceable and did not hold; a line count is.
- **A source comment never points at a document.** No `see ARCHITECTURE.md`, no `SPEC §5.11`, no `.md` filename. A section number shifts the moment one is inserted and a topic phrase outlives the section it named, so the pointer rots while the compiler stays silent — a `SPEC.md §4.8` survived in this repo long after §4.8 stopped existing. State the invariant in the comment; if one line will not hold it, the name above it is not saying enough. Discoverability of the design docs is a repo rule (below and in each package's `CONTRIBUTING.md`), not something to re-litigate at 30 call sites. `packages/di/tests/unit/architecture.test.ts` enforces this. The reverse direction is fine and encouraged: a doc citing a source path or symbol.
- **No numbers in source comments.** No benchmark figures, `ns/op` tables, percentages, byte counts or ratios. They cannot be re-verified where they sit, they go stale silently, and the method behind them is not there either. Numbers live with their method — `ARCHITECTURE.md`, `RESULTS.md`, or the commit.
- **No history.** Code describes what _is_. Never "used to", "previously", "an earlier revision", "the old threshold", "before X existed" — git and the PR carry that, and a reader who wants it knows where to look.
- **Don't argue with the future reader at every site.** One "do not simplify this" belongs in the package's `ARCHITECTURE.md` as a rule, stated once. Scattered inline it becomes the sediment it was meant to prevent — and duplicating an architecture doc is what makes a package's comments read as accreted rather than designed.
- **A module header is one sentence** naming what the module owns. Not a summary of its design.
- **Never put types in comments.** No `@param {string} x` / `@returns {T}` — TS already declares them, and a duplicated type just goes stale. Prefer omitting `@param`/`@returns` entirely. Add `@param name - …` (TSDoc style: a hyphen, **no** `{type}`) or `@typeParam T - …` only to document a non-obvious _meaning_ — units, an invariant, ownership — not the type.
- **`//` comments state the _why_/purpose in one line** — a non-obvious decision, constraint, or gotcha (e.g. `// scoped to the client env — the nitro build sets its own codeSplitting`). If a competent reader could infer it from the code or the types, **delete it**; never narrate obvious lines.
- **A doc comment on an exported symbol** leads with a one-line summary of intent/purpose (what it's _for_, not how it works). Internal helpers get a comment only when non-obvious.
- **TSDoc block tags only when they add what the type can't:** `@remarks` (detail past the summary), `@example`, `@deprecated <reason + replacement>`, `@see`, `@throws`, `@defaultValue`.
- **Speak the API's vocabulary (Apple HIG terms).** In comments and names, **appearance** is the user's preference (Light / Dark / Auto) and **color scheme** is the resolved light/dark value applied — say "appearance" for the preference, "color scheme" for the resolved value, and avoid the legacy "theme" wording. Prefer `/** … */` doc blocks over `//` lines when the comment documents intent.
- **`@since <version>` is generated** by `codefast tag` at release — never hand-write it, and never remove a released one (the add-only tool would re-stamp it with the current version, destroying the true original).
- No commented-out code left behind; a `TODO`/`FIXME` must state why or link an issue.

## API naming (Swift API Design Guidelines, adapted to TS)

Audit every public API you add or touch (exported function/type/prop/option/config key) against these — clarity at the point of use beats brevity, and every word must convey information:

- **No `I` or `T` prefix, and no `Impl` suffix.** An interface describes behaviour, so `Container` — not `IContainer`; `DefaultContainer` — not `ContainerImpl`. **A type parameter is named for what it holds**: `Value`, `Target`, `Deps`, `Ctx`, `Result` — not `T`, `TValue`, `TResult`. A bare `T` says nothing at the use site, which is where the reader meets it. Verbatim external API quoted for comparison (Inversify's `Newable<T>`) keeps its own spelling. This originated as [`packages/di/SPEC.md` §2.1](packages/di/SPEC.md) and applies repo-wide — it lived in one package's spec long enough for another package to drift from it.

- **Name by role, never lie.** A name must state what the thing actually does (`options` for a hard selection criterion, never `hint`; a render function is `renderX`, never `customLabel`). No filler suffixes — `Type` on a type alias says nothing (`AppearanceContextValue`, not `AppearanceContextType`).
- **Properties/types are nouns** (`delivery: "immediate"`, not `deliver`); **side-effecting functions are imperative verbs** (`track`, `flush`); handlers are `onX`.
- **Booleans read as assertions** (`animated`, `isScrollAnchor`, `isTrackingAllowed`), or as conventional option-bag instructions (`trackPageViews`, `includeAds`) when they configure behavior.
- **Hooks take `XxxOptions` and return `XxxResult`** — `Props` is for components only.
- **Compensate weak types with units/role in the name**: `sizeInPixels`, `retryDelayMs`.
- **Precedent beats the rulebook.** Names locked by JS/React/Radix/upstream contracts (`opts` on Carousel, `tv`/`twMerge`, Recharts' `initialDimension`, `create*` factories, `use*` hooks) stay verbatim — renaming a passthrough breaks the compatibility that makes it valuable.
- When renaming for these rules, watch for **shadowing**: a mass rename that collides with an existing local (`const options = options === undefined …`) is a TDZ bug the type checker and tests must catch before commit.

## Packages

| Path                         | Role                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `packages/ui`                | `@codefast/ui` — Radix + Tailwind component library; per-component subpath exports (`./button`, etc.) |
| `packages/tailwind-variants` | Type-safe variant styling API (faster `tailwind-variants` replacement); used by `ui`                  |
| `packages/theme`             | Theme management using React 19 features (optimistic updates, cross-tab sync)                         |
| `packages/di`                | Lightweight dependency-injection primitives (requires Node ≥ 26)                                      |
| `packages/tracking`          | Consent-gated, type-safe event tracking for TanStack Start over a Standard Schema event catalog       |
| `packages/cli`               | `codefast` CLI — subcommands `arrange`, `audit`, `mirror`, `tag` (run via `pnpm run codefast <cmd>`)  |
| `packages/typescript-config` | Shared tsconfig presets                                                                               |
| `packages/benchmark-*`       | Performance benchmark harness/viewer (`pnpm bench`)                                                   |
| `benchmarks/*`               | Benchmark suites comparing `@codefast/*` against upstream (`di-inversify`, `tailwind-variants`)       |
| `apps/ui`                    | Docs/showcase site for `@codefast/ui` (TanStack Start); consumes `packages/*` via `workspace:*`       |
| `examples/tanstack-start`    | TanStack Start consumer demo; uses `workspace:*` so package changes are testable here directly        |

### `packages/di` layout

**`packages/di/ARCHITECTURE.md` is the source of truth — read it before changing anything under `resolution/`.** It records the layering, the invariants each hot path depends on, and which shapes that look simplifiable are load-bearing.

`src/` groups by subsystem: the **model** at the root (`token`, `types`, `constructor-type`, `binding`, `registry`, `errors`, `module`), **`container/`** (container + the fluent binding chain), **`resolution/`** (the engine class plus its collaborators — lookup cache, class introspector, activation-need cache, instantiation-plan compiler, resolution-path cycle guard, scope, lifecycle, environment, binding selection, constraints), **`introspection/`** (inspector, dependency graph, graph adapters), plus `decorators/` and `metadata/`. The sync and async pipelines stay in one class because `#` private fields can't span files and both touch the same private state per hop; anything that doesn't is already extracted. Tests mirror these paths (`tests/unit/resolution/…`). `package.json#exports` is generated from `dist/` by `codefast mirror` — rerun it after moving/adding modules. Verify hot-path changes against `benchmarks/di-inversify` (`pnpm bench:isolate` for order-independent numbers, ≥3 trials, best-of across several processes) before assuming a refactor is free — and measure cold paths too, which the hot loops hide.

## UI/component conventions (apps/ui and packages/ui)

These are project rules the linters do not fully enforce:

- **No Tailwind-classes-in-a-variable** (`const FOO = "flex gap-3"`) — it loses IntelliSense/auto-sort. Write classes inline in `className`. When a class set repeats, extract a **reusable component**, not a string constant. Conditional classes use `cn()` inline. CSS effects (gradient/mask/background-size) use Tailwind arbitrary values (`bg-[radial-gradient(...)]`), not `style` objects.
- **One component per file** under `apps/ui/src/components/**`. Extract sub-components/helpers into their own kebab-case file and import. Accepted co-location exceptions: icon sets, and `*.example.tsx` / `demo.tsx` under `registry/`.
- **No inline prop types.** Declare `interface XxxProps extends ComponentProps<"element">` (matching the host element rendered), spread `{...props}` **last** on that element, and merge classes via `cn(base, className)`. `Omit` any attr the wrapper hard-sets. When forwarding to another component (not a DOM element), extend `ComponentProps<typeof ThatComponent>` and `Omit` the required props the wrapper supplies. Exception: a handler the component must own (e.g. a `CopyButton`'s `onClick`) goes _after_ `{...props}` with a comment.
- **RTL: keep physical classes that sit under a side variant.** `packages/ui` is RTL-hardened with logical utilities + `rtl:` overrides, but physical `left-/right-/border-l/r/slide-in-from-*` classes gated behind `data-[side=…]` (or the custom `data-side-left`/`data-side-right`) are intentional — Radix resolves `side` per reading direction, so converting them to logical double-flips. Run `pnpm run codefast audit rtl` (the RTL scan lives in the `codefast` CLI, config under `audit.rtl` in `codefast.config.js`) to check for genuine gaps.

## Documentation cross-references

`pnpm cli:audit:links` scans every `.md` in the repo for a relative path that does not exist, an in-document anchor with no matching heading, and an anchor into another document the target does not offer — the last of which fails silently in a browser. It gates CI, so a doc link that rots is a red build rather than a discovery months later. Cite a section by an explicit `<a id="…"></a>` anchor rather than a number: a number shifts the moment a section is inserted, and nothing checks it.

## Releases

Versioning is via **Changesets**. Commits follow **Conventional Commits** (enforced by commitlint). Use the `release` skill for the full publish workflow.

**Read the pre-release state, never assume it** — it flips whenever someone runs `release:canary:enter` / `release:canary:exit`, so any statement pinned here goes stale:

```bash
test -f .changeset/pre.json && echo "pre mode: $(python3 -c 'import json;print(json.load(open(".changeset/pre.json"))["tag"])')" || echo "normal mode"
```

`.changeset/pre.json` **present** → pre mode: `changeset version` produces `X.Y.Z-<tag>.N` and publishes under that dist-tag, and every changeset consumed so far is recorded in that file. **Absent** → normal mode: versions land on `latest`. A leftover `canary` dist-tag on npm proves nothing about the current mode — check the file.

**Never author a `major` changeset.** All `@codefast/*` are one `fixed` group (`.changeset/config.json`), so the group versions together at the **highest** bump any changeset requests — a single `major` (even on one package like `@codefast/tracking`) bumps the **whole group** `0.x → 1.0.0`. Breaking changes are `minor`.

**There is no planned 1.0.** These packages are consumed internally by the maintainer's own projects, so the version number is Changesets bookkeeping, not a compatibility promise to third parties — staying on 0.x is what keeps breaking changes cheap, and one stray `major` throws that away permanently. Once a wrong major has been versioned, editing changesets alone can't undo it — the bump is already baked into every `package.json` (plus `pre.json` when in pre mode); the reset recipe is in the `release` skill.
