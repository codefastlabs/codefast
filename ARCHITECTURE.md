# Repository architecture

**Codefast** is a **pnpm + Turborepo** monorepo (Node **≥ 22**, `"type": "module"`). Published libraries live under `packages/`; the docs site is `apps/docs`. Benchmarks live under `benchmarks/`.

## Package map

| Path                         | Package                       | Role                                                                                                      |
| ---------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `packages/typescript-config` | `@codefast/typescript-config` | Shared TS configs for packages/apps                                                                       |
| `packages/tailwind-variants` | `@codefast/tailwind-variants` | Tailwind variant utilities and typing                                                                     |
| `packages/theme`             | `@codefast/theme`             | Theme provider / SSR-friendly theme state                                                                 |
| `packages/ui`                | `@codefast/ui`                | React UI kit (Radix, Tailwind); depends on `tailwind-variants`                                            |
| `packages/cli`               | `@codefast/cli`               | Repo CLI: `arrange`, `mirror`, `tag` — see [`packages/cli/ARCHITECTURE.md`](packages/cli/ARCHITECTURE.md) |
| `packages/di`                | `@codefast/di`                | Small DI primitives (separate from CLI style; do not assume CLI uses hexagonal DI)                        |
| `packages/benchmark-harness` | `@codefast/benchmark-harness` | Shared benchmarking helpers                                                                               |
| `apps/docs`                  | `@apps/docs`                  | Vite + TanStack Start docs app; consumes `@codefast/ui`, `@codefast/theme`, `@codefast/tailwind-variants` |

**Typical dependency direction:** `tailwind-variants` → `ui` → `docs`. CLI is tooling for the monorepo, not a runtime dependency of the UI packages.

## Tooling (root)

- **Install / build:** `pnpm install`; `pnpm build:packages` or `turbo run build`
- **Quality gate:** `pnpm check` (lint, format check, types across packages)
- **Lint / format:** Oxlint, Oxfmt (`pnpm lint`, `pnpm format`)
- **Tests:** Vitest per package (`pnpm test`, package-specific `test:unit` / `test:e2e` where defined)
- **Releases:** Changesets (`pnpm release`, `version-packages`)

Versions for shared deps are centralized in **`pnpm-workspace.yaml`** `catalog` (strict catalog mode).

## Boundaries

- **UI components** belong in `@codefast/ui` with existing export patterns in `package.json` `exports`; prefer extending primitives/hooks there rather than duplicating in `apps/docs`.
- **CLI** stays intentionally lightweight (Commander, `Result`/`AppError`, domains under `*/domain/`); details in `packages/cli/ARCHITECTURE.md` and `packages/cli/SPEC.md`.
- **Apps** (`apps/docs`) should compose published/workspace packages; avoid copying library logic into the app when it belongs in a package.

## Further reading

- CLI layout and naming: [`packages/cli/ARCHITECTURE.md`](packages/cli/ARCHITECTURE.md)
- Per-package READMEs under each `packages/*` and `apps/docs`
