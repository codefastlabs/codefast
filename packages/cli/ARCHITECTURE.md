# CLI package architecture

The `@codefast/cli` package is a **small Node CLI** (top-level commands: `arrange`, `audit`, `mirror`, `pack-slim`,
`tag`). It intentionally avoids hexagonal/DI ceremony: behavior is wired with **plain functions**, **Commander** for
argv, and **`Result<T, AppError>`** for recoverable failures.

## Per-command skeleton

Every command directory follows one shape, so a reader who knows one command knows them all:

| File                          | Role                                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `command.ts`                  | Commander wiring only: `.argument` / `.option` / `.action`, no serialization inline.        |
| `cli-schema.ts`               | Zod argv schema(s), named for what they parse.                                              |
| `prepare.ts`                  | Prelude: resolve repo root + config into a request (present only when a command needs one). |
| `run.ts` / `run-<variant>.ts` | The async orchestrator(s), returning `Result<T, AppError>`.                                 |
| `output.ts`                   | Human presenters (`present*`) — side effects through `logger`.                              |
| `cli-result.ts`               | Machine output — the `--json` string (pure) and the exit-code mapping (pure).               |
| `domain/`                     | Pure logic and types: no Commander, no `process`, no `logger`.                              |

The orchestrator role is always `run*` — never `sync`, which survives only as `mirror`'s domain verb (it syncs
`package.json` exports). I/O that goes through the `FilesystemPort` (a `run*.ts`, a `prepare.ts`, a per-file helper)
stays at the command root; `domain/` is reserved for what is pure, which is why an I/O-heavy command like `tag` keeps
only `types.ts` under `domain/`.

A command that has **subcommands** nests one level further: each subcommand (`audit rtl`, `audit links`, …;
`arrange inspect`, `arrange simplify`, …) is its own directory under the command, holding the same skeleton for its own
slice — its `run.ts`, `cli-schema.ts`, `output.ts`, `cli-result.ts`, `domain/`. The parent `command.ts` wires the
subcommands together; whatever they share (the `audit` runner, `arrange`'s grouping engine under `domain/`, a
`prepare.ts` prelude) stays at the command root. `mirror`, `pack-slim` and `tag` have no subcommands, so they stay flat.

## Layout (`src/`)

| Area                               | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`bin.ts`](src/bin.ts)             | Process entry: shebang, `runCli`, `process.exit`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| [`cli.ts`](src/cli.ts)             | Composition root: `Command` program, global options, registers `createArrangeCommand()`, `createAuditCommand()`, `createMirrorCommand()`, `createPackSlimCommand()`, `createTagCommand()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [`core/`](src/core/)               | Shared primitives: `Result` / `AppError` / `messageFrom`, filesystem (`nodeFilesystem`), workspace discovery, Zod `parseWithSchema`, `logger`, `consumeCliAppError`, path-lesson text edits, TypeScript file walking.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| [`core/config/`](src/core/config/) | Zod schema ([`schema.ts`](src/core/config/schema.ts)), config load + cache ([`loader.ts`](src/core/config/loader.ts)), warning lines ([`warnings.ts`](src/core/config/warnings.ts)). [`core/config.ts`](src/core/config.ts) exposes `loadCodefastConfig` as the public `Result`-based API.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| [`arrange/`](src/arrange/)         | Tailwind `cn()` / `tv()` tooling: parent [`command.ts`](src/arrange/command.ts) wires four subcommand directories — [`regroup/`](src/arrange/regroup/) (the default run), [`inspect/`](src/arrange/inspect/), [`simplify/`](src/arrange/simplify/), [`group/`](src/arrange/group/); the shared grouping engine is [`domain/`](src/arrange/domain/) + [`domain/ast/`](src/arrange/domain/ast/), with [`prepare.ts`](src/arrange/prepare.ts) and [`scan-target.ts`](src/arrange/scan-target.ts) shared at the root.                                                                                                                                                                                                                                                               |
| [`audit/`](src/audit/)             | Read-only audits — the parent [`command.ts`](src/audit/command.ts) drives one `AuditCheck` descriptor per scan, and each scan is its own directory: [`rtl/`](src/audit/rtl/) (physical-direction Tailwind classes), [`links/`](src/audit/links/) (markdown cross-references that resolve to nothing), [`comments/`](src/audit/comments/) (doc-comment conventions), [`imports/`](src/audit/imports/) (banned import forms — React by-name, Zod namespace in front-end packages — the tier oxlint cannot express), [`display-names/`](src/audit/display-names/). Each holds its own `run.ts`, schema, presenters and `domain/` detectors; [`domain/types.ts`](src/audit/domain/types.ts) and [`prepare.ts`](src/audit/prepare.ts) are shared. Add a scan by adding a descriptor. |
| [`mirror/`](src/mirror/)           | `package.json` exports sync: commands, `prepare` / `run`, workspace package sync implementation, progress presenter, [`domain/exports.ts`](src/mirror/domain/exports.ts) for export map generation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| [`pack-slim/`](src/pack-slim/)     | Trims dev-only fields from `package.json` before publish: commands, `run`, [`working-tree.ts`](src/pack-slim/working-tree.ts), progress presenter, [`domain/transform.ts`](src/pack-slim/domain/transform.ts) for the pure edit.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| [`tag/`](src/tag/)                 | `@since` TSDoc tagging: commands, `prepare` / `run`, target discovery, since-writer, presenters.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Boundaries

- **Domain modules** (`*/domain/**`) stay **pure** where possible: no Commander, no `process`, no ad-hoc logging—only
  types and algorithms (I/O lives in callers or thin `core/` helpers).
- **Commands** (`*/command.ts`) parse argv, call `parseWithSchema` / `consumeCliAppError`, delegate to `prepare*` /
  `run*` functions, set `process.exitCode`. No serialization or exit-code logic lives inline in a `command.ts`.
- **Output** splits by audience: `output.ts` presents to a human through `logger` (a side effect, spied in tests);
  `cli-result.ts` is the pure machine output — the `--json` string and the exit-code mapping, asserted on directly.
- **Config** is loaded once per resolved repo root via [`core/config/loader.ts`](src/core/config/loader.ts); warnings go
  through [`core/config/warnings.ts`](src/core/config/warnings.ts).

## Imports

Internal code uses the `#/…` alias (see `package.json` `imports`). Prefer `#/core/…`, `#/arrange/…`, etc., over deep
relative paths.

## File naming

Rationale lives in [`DECISIONS.md`](DECISIONS.md).

- Prefer **one concept per filename** (`grouping.ts`, `grouping-service.ts`, `analyze-service.ts`, `exports.ts`).
- The per-command skeleton fixes a role name to each file: `command.ts`, `cli-schema.ts`, `prepare.ts`, `run*.ts`,
  `output.ts`, `cli-result.ts`. The orchestrator is `run*`, never `sync` — `sync` is `mirror`'s domain verb alone; the
  `output.ts` presenters are `present*`. A file that fills a role slot takes the role name even when its work has a verb
  of its own — an "analyze" orchestrator is `run.ts`, with the concept kept in `domain/analyze-service.ts`.
- **`ast/`** uses short names: `ast-node.ts`, `helpers.ts`, `collectors-cn.ts`, `targets.ts`, `translator.ts`, etc.
- Zod schemas are named for what they parse, not with a reserved suffix: per-command argv schemas are `cli-schema.ts`,
  the config schema is [`core/config/schema.ts`](src/core/config/schema.ts).
- **`.test.ts`** is reserved for Vitest. No `*.port.ts`, `*.adapter.ts`, `*.domain-service.ts`, or `*.value-object.ts`
  in new code.

## Testing

Tests live under [`tests/`](tests/) only (see workspace rules). The CLI Vitest profile is **Node**, `tests/**/*.test.*`,
`passWithNoTests: true`.

## Further reading

- Product behavior and commands: [`README.md`](README.md).
- Design decisions and their reasons: [`DECISIONS.md`](DECISIONS.md).

## License

Released under the [MIT License](./LICENSE).
