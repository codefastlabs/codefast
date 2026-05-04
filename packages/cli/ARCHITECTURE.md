# CLI package architecture

The `@codefast/cli` package is a **small Node CLI** (three top-level commands: `arrange`, `mirror`, `tag`). It intentionally avoids hexagonal/DI ceremony: behavior is wired with **plain functions**, **Commander** for argv, and **`Result<T, AppError>`** for recoverable failures.

## Layout (`src/`)

| Area                       | Role                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`bin.ts`](src/bin.ts)     | Process entry: shebang, `runCli`, `process.exit`.                                                                                                                                                                                                                                                                                                                                        |
| [`cli.ts`](src/cli.ts)     | Composition root: `Command` program, global options, registers `createArrangeCommand()`, `createMirrorCommand()`, `createTagCommand()`.                                                                                                                                                                                                                                                  |
| [`core/`](src/core/)       | Shared primitives: `Result` / `AppError` / `messageFrom`, filesystem (`nodeFilesystem`), workspace discovery, Zod `parseWithSchema`, `logger`, `consumeCliAppError`, path-lesson text edits, TypeScript file walking.                                                                                                                                                                    |
| [`config/`](src/config/)   | Zod schema ([`schema.ts`](src/config/schema.ts)), config load + cache ([`loader.ts`](src/config/loader.ts)), warning lines ([`warnings.ts`](src/config/warnings.ts)). [`core/config.ts`](src/core/config.ts) exposes `loadCodefastConfig` as the public `Result`-based API.                                                                                                              |
| [`arrange/`](src/arrange/) | Tailwind `cn()` / `tv()` tooling: Commander tree ([`command.ts`](src/arrange/command.ts)), orchestration ([`analyze.ts`](src/arrange/analyze.ts), [`sync.ts`](src/arrange/sync.ts), [`workspace.ts`](src/arrange/workspace.ts), …), [`output.ts`](src/arrange/output.ts) for stdout, [`domain/`](src/arrange/domain/) for pure logic + [`domain/ast/`](src/arrange/domain/ast/) for AST. |
| [`mirror/`](src/mirror/)   | `package.json` exports sync: commands, `prepare` / `sync`, workspace package sync implementation, progress presenter, [`domain/exports.ts`](src/mirror/domain/exports.ts) for export map generation.                                                                                                                                                                                     |
| [`tag/`](src/tag/)         | `@since` JSDoc tagging: commands, `prepare` / `sync`, target discovery, since-writer, presenters.                                                                                                                                                                                                                                                                                        |

## Boundaries

- **Domain modules** (`*/domain/**`) stay **pure** where possible: no Commander, no `process`, no ad-hoc logging—only types and algorithms (I/O lives in callers or thin `core/` helpers).
- **Commands** (`*/command.ts`) parse argv, call `parseWithSchema` / `consumeCliAppError`, delegate to `prepare*` / `run*` functions, set `process.exitCode`.
- **Config** is loaded once per resolved repo root via [`config/loader.ts`](src/config/loader.ts); warnings go through [`config/warnings.ts`](src/config/warnings.ts).

## Imports

Internal code uses the `#/…` alias (see `package.json` `imports`). Prefer `#/core/…`, `#/arrange/…`, etc., over deep relative paths.

## File naming (post-refactor)

Per [`SPEC.md`](SPEC.md) §5 and §3.1:

- Prefer **one concept per filename** (`grouping.ts`, `grouping-service.ts`, `analyze-service.ts`, `exports.ts`).
- **`ast/`** uses short names: `ast-node.ts`, `helpers.ts`, `collectors-cn.ts`, `targets.ts`, etc.
- Reserved suffixes: **`.schema.ts`** (Zod), **`.test.ts`** (Vitest). No `*.port.ts`, `*.adapter.ts`, `*.domain-service.ts`, or `*.value-object.ts` in new code.

## Testing

Tests live under [`tests/`](tests/) only (see workspace rules). The CLI Vitest profile is **Node**, `tests/**/*.test.*`, `passWithNoTests: true`.

## Further reading

- Product behavior and commands: [`README.md`](README.md).
- Refactor rationale and checklist: [`SPEC.md`](SPEC.md).
