# ADR-001: Explicit Architecture for `@codefast/cli`

## Status

Accepted — describes the layering and dependency rules enforced in this monorepo for the Codefast CLI package.

## Context

The CLI orchestrates several bounded contexts (arrange, mirror, tag) plus shared kernel (`core`) and configuration (`config`). We optimize for **testability**, **clear boundaries**, and **safe evolution** when automation (including AI-assisted edits) touches the tree.

## Decision

We adopt **Explicit Architecture** (hexagonal-style) with four layers per bounded context:

| Layer            | Role                                                             |
| ---------------- | ---------------------------------------------------------------- |
| **domain**       | Pure models, domain services, no I/O, no framework imports.      |
| **application**  | Use cases; depends on domain and **ports** (interfaces) only.    |
| **infra**        | Adapters: filesystem, parsers, workspace discovery, process I/O. |
| **presentation** | CLI formatting, command wiring, user-visible messages.           |

Cross-cutting **ports** for CLI I/O live under `core/application/ports/` (e.g. `CliFs`, `CliLogger`) so `application/` never references `infra/` for contracts.

### Result pattern

Use-case entry points exposed to commands return `Result<T, AppError>` where `AppError` carries a small stable `code` (`NOT_FOUND`, `VALIDATION_ERROR`, `INFRA_FAILURE`) and a user-safe `message`. Validation uses Zod at boundaries; failures map to `VALIDATION_ERROR`. Unexpected I/O failures map to `INFRA_FAILURE` with optional `cause` for verbose diagnostics (`CODEFAST_VERBOSE=1`).

### Dependency rules (enforced)

1. **domain** must not import `application`, `infra`, or `presentation` (including `#lib/infra/...`).
2. **application** must not import `infra` or `presentation` (including `#lib/<context>/infra` and `#lib/infra/...`).
3. **Bounded contexts** (`arrange`, `mirror`, `tag`): `domain` in one context must not import `domain` from another.
4. **core/domain** and **config/domain** must not depend on `arrange|mirror|tag` domain types.

CI enforces rules (1)–(4) via the co-located test `packages/cli/src/lib/core/application/architecture-boundaries.policy.test.ts` (run `pnpm test` from the repo root, or `pnpm --filter @codefast/cli test` for CLI-only) and `packages/cli/src/lib/core/application/architecture-boundaries.policy.ts`.

### Observability

Port implementations may be wrapped at the composition root (`createCliContainer`) when `ENABLE_TELEMETRY=1` or `ENABLE_TELEMETRY=true`, without changing use-case code. Timelines and summarized arguments are written with `CliLogger.out` under a `[telemetry:…]` prefix (the logger itself is not wrapped, to avoid recursion).

Infrastructure failures surfaced as `INFRA_FAILURE` log the user-safe message always; when `CODEFAST_VERBOSE=1` or `true`, `consumeCliAppError` also prints the `cause` stack (if any) after the formatted line.

## Consequences

- New adapters belong in `infra/` and are wired only from `core/infra/container.ts` (or equivalent composition roots).
- Forbidden imports fail `pnpm test` / the architecture test file — treat that as a merge blocker.
- Contributors should read this ADR before adding cross-context imports or pulling framework types into `domain/`.
