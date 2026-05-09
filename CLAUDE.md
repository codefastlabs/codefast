# Project Guidelines

## Monorepo Overview

pnpm + Turbo monorepo. Workspace layout:

```
apps/docs              # TanStack Start documentation/showcase site
packages/ui            # React UI component library (Radix UI + Tailwind CSS)
packages/cli           # Developer CLI (arrange, mirror, tag commands)
packages/di            # Lightweight dependency injection / IoC
packages/theme         # Theme management with React 19
packages/tailwind-variants  # Type-safe Tailwind CSS variant utilities
packages/benchmark-harness  # Shared tinybench infrastructure
packages/typescript-config  # Shared TypeScript base configs
benchmarks/            # Performance benchmarks (di-inversify, tailwind-variants)
```

Run tasks at workspace root via Turbo. To scope to one package, use `--filter`:

```sh
pnpm --filter @codefast/ui test
pnpm --filter @codefast/cli check-types
```

---

## Toolchain

| Tool         | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| **tsdown**   | Unbundled ESM build (`dist/`), excludes test/stories files   |
| **Vitest 4** | Test runner — node or jsdom environment per package          |
| **oxlint**   | Linter (Rust-based, fast) — `pnpm lint` / `pnpm lint:fix`    |
| **oxfmt**    | Formatter (Rust-based) — `pnpm format` / `pnpm format:check` |
| **Turbo**    | Task orchestration and caching                               |

Key root scripts:

| Script             | What it runs                                                   |
| ------------------ | -------------------------------------------------------------- |
| `pnpm check:fix`   | `lint:fix` + `format` (auto-fix)                               |
| `pnpm check`       | `lint` + `format:check` + `check-types`                        |
| `pnpm check-types` | TypeScript type checking across all packages                   |
| `pnpm test`        | Vitest test suite                                              |
| `pnpm verify`      | Full pipeline: build + check:fix + check-types + test:coverage |
| `pnpm build`       | tsdown build for all packages                                  |

> `pnpm check:fix` runs automatically after every file edit via the PostToolUse hook.

---

## Internal Imports

- Use absolute internal imports with `#/...` for project code.
- Do not introduce relative imports (`./`, `../`) between internal modules when `#/...` is possible.
- For tests, use `#/tests/...` aliases when available.

### Alias naming convention

All packages define these in both `package.json` `imports` and `tsconfig.json` `paths`:

```json
{
  "#/*": ["./src/*", "./src/*.ts", "./src/*/index.ts"],
  "#/tests/*": ["./tests/*", "./tests/*.ts", "./tests/*/index.ts"]
}
```

### Allowed exception

Relative imports are allowed only when the target is outside alias-mapped roots (`src/**`, `tests/**`) or when no `#/...` alias exists for that path.

### Refactor rule

- When moving files, normalize imports to `#/...` immediately.
- Never mix alias styles like `#/test/*` vs `#/tests/*` in the same package.

---

## Test Layout (Hard-Break)

- **Never** place tests under `src/**`.
- Forbidden in `src/**`: `*.test.*`, `*.bench.*`, `__tests__/`, `*.test-helper.*`.
- All tests go under `tests/**` only:
  - Unit: `tests/unit/**`
  - Integration: `tests/integration/**`
  - E2E: `tests/e2e/**` (subprocess / real network / cross-process)
  - Type: `tests/types/**` (`expectTypeOf` static type tests)
  - Helpers/fixtures: `tests/support/**` or `tests/fixtures/**` (NOT named `*.test.*` / `*.spec.*`)
- Mirror the `src/` path structure for discoverability.
- Full taxonomy reference + commands: see [`TESTING.md`](./TESTING.md).

### Required when creating/moving tests

1. Keep `src/**` test-free.
2. Vitest include glob is the union of categories:
   `tests/{unit,integration,e2e,types}/**/*.test.?(c|m)[jt]s?(x)`.
   Tests outside those four categories are unmatched and will not run.
3. Coverage scope on `src/**` only.
4. Run `pnpm verify` to validate placement workspace-wide.

---

## Vitest + tsdown Profiles

### Node/Core profile

Applies to: `cli`, `di`, `tailwind-variants`, `benchmark-harness`

```ts
// vitest.config.ts
environment: "node"
include: ["tests/**/*.test.?(c|m)[jt]s?(x)"]
passWithNoTests: true
coverage.include: ["src/**/*.ts"]
coverage.exclude: ["src/**/*.test.?(c|m)[jt]s?(x)", "**/*.d.ts"]

// tsdown.config.ts
entry: ["src/**/*.ts", "!src/**/*.test.{ts,tsx}"]
```

### React/UI profile

Applies to: `ui`, `theme`

```ts
// vitest.config.ts
environment: "jsdom"
include: ["tests/**/*.test.?(c|m)[jt]s?(x)"]
passWithNoTests: true
coverage.include: ["src/**/*.{ts,tsx}"]
coverage.exclude: ["src/**/*.{test,stories}.?(c|m)[jt]s?(x)", "**/*.d.ts"]

// tsdown.config.ts
entry: ["src/**/*.{ts,tsx}", "!src/**/*.{test,stories}.{ts,tsx}"]
```

### Consistency checks

- Keep config patterns aligned across packages of the same profile.
- Avoid one-off glob variants unless there is a documented package-specific reason.

---

## TypeScript Naming & Clean Identifiers

When writing, modifying, or refactoring TypeScript (`.ts` / `.tsx`), treat names as part of the product: **a reader should understand intent in seconds**, not decode abbreviations or patterns.

### North star

- **Clarity** — If you would add a comment to explain a name, rename instead.
- **Simplicity** — One concept, one word per module (`capturePayment` _or_ `processPayment`, not both).
- **Focus** — Name the **job** (`CheckoutOrchestrator`, `CartManager`), not the wiring (`*Impl`).

### Casing

| Kind                                     | Convention         | Examples                          |
| ---------------------------------------- | ------------------ | --------------------------------- |
| Variables, object properties, functions  | `camelCase`        | `userName`, `fetchUserOrders`     |
| Classes, interfaces, type aliases, enums | `PascalCase`       | `UserProfile`, `OrderStatus`      |
| Module-level constants / config          | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| `const` inside functions                 | `camelCase`        | `const pageSize = 20`             |

### Booleans & result shapes

- Prefix with: `is`, `has`, `should`, `can`, `will` (`isActive`, `hasPermission`).
- Avoid bare adjectives on domain types: `active: boolean` → `isActive`.
- `result` is fine as a **suffix** (`couponResult`) — avoid it standalone.
- Enums with exactly two states → replace with a boolean with verb prefix.

### Arrays & collections

Use **plural** nouns (`users`, `productIds`) or explicit suffix (`categoryList`) when it reads better.

### Functions & methods

Start with an **action verb**: `calculateTotalPrice`, `reserveInventoryForCheckout`, `listSupportedGateways`.

### Classes: services, orchestration, adapters

Prefer **intent / role** over `*Impl`. Flexible suffixes:

| Suffix               | Use when                                     |
| -------------------- | -------------------------------------------- |
| `Orchestrator`       | One flow coordinates many collaborators      |
| `Manager`            | Owns lifecycle or rules for one bounded area |
| `Processor`          | Ordered pipeline with clear stages           |
| `Dispatcher`         | Fan-out to channels or handlers              |
| `Client` / `Gateway` | Outbound integration over HTTP/SDK           |

### Persistence & adapter naming

| Kind                | Pattern                                 | Examples                            |
| ------------------- | --------------------------------------- | ----------------------------------- |
| Persistence         | `Aggregate` + Technology + `Repository` | `ProductPostgresRepository`         |
| Search / read-model | `Aggregate` + Technology + role         | `ProductElasticsearchSearchService` |

- **Contract** stays technology-free. **Concrete class** carries domain + infrastructure.

### Interfaces & types

Do **not** use `I` / `T` prefixes. Name from the domain noun: `interface User`, not `IUser`.

### Generic type parameters

Prefer descriptive names over single letters outside short utility types:

| Avoid     | Prefer                    |
| --------- | ------------------------- |
| `T`       | `Value`, `Item`, `Entity` |
| `K`       | `Key`, `TokenKey`         |
| `TResult` | `Result`                  |

**Exception:** `K` / `V` acceptable inside standard `Map`-like utility types.

### Language, boundaries, abbreviations

- **English only** for all identifiers, comments, and docstrings.
- Prefer clear names over abbreviations: `maxUserConnectionLimit` over `maxUsrConn`.
- Avoid generic names (`data`, `info`, `val`, `temp`, `obj`) unless scope is tiny and obvious.
- No `*Impl` suffix; no `I`/`T` prefix on interfaces/types.

### Callbacks & small scopes

- Short universally-recognized names (`fn`, `prev`/`next`, `err`) are acceptable in small obvious scopes.
- Narrow lambdas (`items.map((item) => …)`) may stay short.
- In business-critical reduces, use explicit accumulators: `runningSubtotal` + `cartLine`.

---

## Implementation Self-Check

Before finalizing any coding task:

1. **Import hygiene**
   - Internal imports use `#/...` aliases.
   - Test imports use `#/tests/...` when applicable.
   - No new relative imports between internal modules.

2. **Test placement**
   - No test files under `src/**`.

3. **Config consistency**
   - If `vitest.config.ts` changed → still matches the package's profile (node or jsdom).
   - If `tsdown.config.ts` changed → exclude globs still match profile rules.

4. **Verification**
   - Run `pnpm check-types` and `pnpm test` after substantive edits.
   - Report results explicitly in the final response.

If any item fails, fix it before concluding.
