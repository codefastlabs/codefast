# `@codefast/cli` — design decisions

The choices that shape this package and the reasons behind them. [`ARCHITECTURE.md`](./ARCHITECTURE.md) describes the
resulting layout; [`README.md`](./README.md) describes what the commands do. Each decision below still holds; a decision
that stops holding gets replaced here, not annotated.

## 1. Plain functions, not Explicit Architecture

**Context.** The CLI has four top-level commands (`arrange`, `audit`, `mirror`, `tag`), each a short pipeline: read
files, run a pure transformation, print or write the result. An earlier revision applied full Explicit / Hexagonal
Architecture to it — a port interface per use case, an adapter per port, a DI token per injectable, request objects for
one-field inputs, and a `shell/` layer wrapping `node:fs`, `node:path`, `process` and Commander behind eleven more
ports. Roughly three files in four existed to connect the other one, and the `@codefast/di` container resolved at
runtime what a function call would have checked at compile time.

**Decision.** Behaviour is wired with plain functions. A command module builds its Commander subcommand and calls
`prepare*` / `run*` functions directly; domain modules export pure functions; output modules export `print*` functions.
There is no container, no module registry, no token. Node built-ins are called through thin helpers in `core/` only
where a helper adds something (a `Result`, a normalised error), never to make them injectable.

**Consequences.** Dependencies are visible as imports and checked by `tsc`. A new command is one directory with
`command.ts`, `run*.ts`, `domain/` and `output.ts`. The cost is that swapping an implementation for a test means passing
a temp directory or spying on `logger`, not binding a mock — accepted, because every infrastructure call here is cheap
to exercise for real. This is the worked example the `@codefast/di` "explicit architecture" samples cite when they say
the pattern must be earned by the domain: a CLI of this size does not earn it.

## 2. An interface needs a second implementation

**Context.** Under the previous layout every interface had exactly one implementation, so the interface documented
nothing and guaranteed nothing; it existed because the architecture required a port.

**Decision.** An interface or abstract type is introduced only when at least two concrete implementations exist, or when
a module genuinely needs a test double that a real temp path or a `vi.spyOn` cannot provide. Pure domain code needs
none.

**Consequences.** The `core/filesystem/node.ts` helpers are functions, not an adapter behind a port; telemetry or
timing, when wanted, wraps a function (`withX(fn)`) instead of hooking a container activation.

## 3. Commander is the command model

**Context.** Commander already gives a declarative, composable tree of commands, options and actions. The earlier
`CommandTree` / `CommandRouteWire` JSON that was translated into Commander added a layer with no extra capability.

**Decision.** Each `<command>/command.ts` exports `create<Name>Command(): Command` and uses the Commander API directly;
`cli.ts` is the composition root that registers the four commands and global options.

**Consequences.** Adding a flag is one `.option()` call next to the action that reads it. Argv validation stays a Zod
schema per command (`cli-schema.ts`) parsed through `parseWithSchema`, so shape errors are reported as usage errors, not
as stack traces.

## 4. `Result<T, AppError>` for recoverable failures

**Context.** A CLI's failures are mostly expected: a missing config, an unparsable file, a path outside the workspace.
Throwing for those turns every caller into a `try`/`catch` and loses the error code the exit code depends on.

**Decision.** Fallible operations return `Result<T, AppError>` (`core/result.ts`, `core/errors.ts`). `AppError` is a
plain object with a code, not an `Error` subclass, so building one costs no stack capture. One boundary,
`consumeCliAppError` / `runCliResultAsync` in `core/cli/result-handle.ts`, turns an `err` into a formatted message and
the matching exit code (`core/exit-codes.ts`); unexpected exceptions still propagate.

**Consequences.** Domain and orchestration code never touch `process.exitCode`; only the command boundary does. Error
text is produced in one place (`formatAppError`), so `--json` and human output stay consistent.

## 5. Presenters are output functions

**Context.** Printing a report is a side effect at the edge; it never needs to be abstracted over.

**Decision.** Each command directory has an `output.ts` (or a small `*-reporter.ts`) whose exported functions write
through `core/logger.ts`. `logger` is a plain object so a test can `vi.spyOn(logger, "out")`.

**Consequences.** Output changes never touch orchestration; `--json` variants are sibling functions in the same file.

## 6. Parse TypeScript with `oxc-parser`

**Context.** `arrange` and `tag` read and rewrite TypeScript source. The classic `typescript` compiler API was the only
consumer of that runtime in the repository once the build moved to native TypeScript 7, and it was also the slowest step
of every `arrange` run.

**Decision.** AST work (`arrange/domain/ast/`, `tag`) uses `oxc-parser`; edits are applied as text ranges
(`core/source-text-edit.ts`) rather than by printing a transformed AST, so untouched code keeps its formatting byte for
byte.

**Consequences.** Nothing in the repository depends on the classic `typescript` runtime. The trade is that the CLI reads
syntax only — it never type-checks — which is all four commands need.

## 7. Audits are read-only and mechanical

**Context.** `audit rtl`, `audit links`, `audit comments` and `audit react` gate CI. A gate that needs judgment to
interpret, or that can only be fixed by hand, is ignored under time pressure.

**Decision.** Every audit reports a location and a one-line reason, exits non-zero on any finding, and where the fix is
mechanical offers `--fix` (comment dividers) so a red run is one command from green. Allowlists live in
`codefast.config.js`, never in the audited files.

**Consequences.** Audits stay cheap to keep on; a new rule has to come with a precise detector or it does not ship.

## 8. Naming

**Context.** Suffixes such as `.port.ts`, `.adapter.ts`, `.domain-service.ts`, `.value-object.ts` and `.coordination.ts`
described the pattern a file played in the old architecture, not what the file contained.

**Decision.** One concept per file, named for the concept: `grouping.ts`, `analyze.ts`, `exports.ts`. The only reserved
suffix is `.test.ts`; Zod schemas are named for what they parse (`cli-schema.ts`, `core/config/schema.ts`). Directory
names are the four commands plus `core/`, and a command's pure logic lives under its `domain/`.

**Consequences.** A filename says what a module does; the directory says which command it belongs to.

## 9. Tests

**Context.** With no container, a test calls the function it targets.

**Decision.** Unit tests live under `tests/unit/`, mirroring `src/`, and run in Node. Filesystem-touching code is tested
against temp directories; output through spies on `logger`. There is no mocking layer for infrastructure.

**Consequences.** Adding a test means importing a function and asserting on a `Result`. Coverage is enforced by the
workspace's `test:coverage` gate, not by this document.

## License

Released under the [MIT License](./LICENSE).
