# CLI package architecture

## Hexagonal boundaries

- **`shell/application/ports/inbound/`** — inbound ports for application use cases: interfaces are named `*UseCasePort`; concrete classes live under `application/use-cases/` as `*UseCase` (no `Impl`).
- **`shell/application/ports/primary/`** — driver ports for how the CLI is invoked (Commander trees, argv-shaped dispatch). Driving adapters (e.g. `CommanderCliHostAdapter`) depend on these; they complement, not replace, `ports/inbound`.
- **`application/ports/outbound/`** — outbound ports implemented in `infrastructure/adapters/`.
- **`presentation/`** — presenters and command bindings; presenters implement `application/ports/presenting/` interfaces.

Composition roots: domain `*.module.ts`, `bootstrap/cli-application.module.ts`, `bootstrap/composition-root.ts`, and `bootstrap/register-cli-command-trees.ts` (Commander tree attachment).

## File naming

- Outbound port implementations: `*.adapter.ts`, class suffix `*Adapter`.
- Prefer grouping shell outbound adapters under `shell/infrastructure/adapters/`; technology-specific folders (`node/`, `workspace/`, `telemetry/`, `commander/`) remain for non-generic or driver-specific wiring.
- Presenters: class name matches the presenting port (use a type alias in the presenter file when the interface and class share a name).
- Domain orchestration: `*.domain-service.ts` under `domain/`; avoid `*Impl` on domain classes — use a role name such as `*DomainService` when the module already defines a `*Service` interface.
