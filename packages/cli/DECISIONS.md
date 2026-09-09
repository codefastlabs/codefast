# `@codefast/cli` — design decisions

The choices that shape this package and the reasons behind them. [`ARCHITECTURE.md`](./ARCHITECTURE.md) describes the
resulting layout; [`README.md`](./README.md) describes what the commands do. Each decision below still holds; a decision
that stops holding gets replaced here, not annotated.

## Plain functions, not Explicit Architecture

**Context.** The CLI has five top-level commands (`arrange`, `audit`, `mirror`, `pack-slim`, `tag`), each a short
pipeline: read files, run a pure transformation, print or write the result. An earlier revision applied full Explicit /
Hexagonal Architecture to it — a port interface per use case, an adapter per port, a DI token per injectable, request
objects for one-field inputs, and a `shell/` layer wrapping `node:fs`, `node:path`, `process` and Commander behind
eleven more ports. Roughly three files in four existed to connect the other one, and the `@codefast/di` container
resolved at runtime what a function call would have checked at compile time.

**Decision.** Behaviour is wired with plain functions. A command module builds its Commander subcommand and calls
`prepare*` / `run*` functions directly; domain modules export pure functions; output modules export `present*`
functions. There is no container, no module registry, no token. Node built-ins are called through thin helpers in
`core/` only where a helper adds something (a `Result`, a normalised error), never to make them injectable.

**Consequences.** Dependencies are visible as imports and checked by `tsc`. A new command is one directory following a
fixed skeleton — `command.ts` (Commander wiring), `cli-schema.ts` (argv), `prepare.ts` (prelude), `run*.ts`
(orchestration), `output.ts` (human), `cli-result.ts` (machine), `domain/` (pure) — so one command reads like the next.
The cost is that swapping an implementation for a test means passing a real path or spying on `logger`, not binding a
mock — accepted, because every infrastructure call here is cheap to exercise for real. This is the worked example the
`@codefast/di` "explicit architecture" samples cite when they say the pattern must be earned by the domain: a CLI of
this size does not earn it.

## An interface needs a second implementation

**Context.** Under the previous layout every interface had exactly one implementation, so the interface documented
nothing and guaranteed nothing; it existed because the architecture required a port.

**Decision.** An interface or abstract type is introduced only when at least two concrete implementations exist, or when
a module genuinely needs a test double that a real temp path or a `vi.spyOn` cannot provide. Pure domain code needs
none.

**Consequences.** The `core/filesystem/node.ts` helpers are functions, not an adapter behind a port; telemetry or
timing, if ever wanted, wraps a function instead of hooking a container activation.

## Commander is the command model

**Context.** Commander already gives a declarative, composable tree of commands, options and actions. The earlier
`CommandTree` / `CommandRouteWire` JSON that was translated into Commander added a layer with no extra capability.

**Decision.** Each `<command>/command.ts` exports `create<Name>Command(): Command` and uses the Commander API directly;
`cli.ts` is the composition root that registers the five commands and global options. The prepare → guard → parse → run
→ report → exit control flow every command and subcommand repeats is written once in `core/cli/command-pipeline.ts`; a
`command.ts` supplies only a descriptor of typed slots, so the spine is never copied per command.

**Consequences.** Adding a flag is one `.option()` call next to the action that reads it. Argv validation stays a Zod
schema per command (`cli-schema.ts`) parsed through `parseWithSchema`, so shape errors are reported as usage errors, not
as stack traces.

## Subcommands nest like commands

**Context.** `audit` and `arrange` each carry several subcommands. Left flat, a command directory became a pile of
`run-rtl.ts`, `run-links.ts`, … beside a `domain/` holding every scan's detectors, and the file name was the only thing
saying which scan a file served.

**Decision.** A subcommand is a directory under its command with the same skeleton as a command: its own `run.ts`,
`cli-schema.ts`, `output.ts`, `cli-result.ts` and `domain/`. What the subcommands genuinely share stays at the command
root — the `audit` runner and its `prepare` helper, `arrange`'s grouping engine under `domain/`. A file moves into a
subcommand only when that subcommand alone uses it; anything two subcommands use is shared, not duplicated.

**Consequences.** Everything about one scan lives in one folder (`audit/rtl/`, `arrange/inspect/`), and `audit/domain/`
holds only what every scan shares. `mirror`, `pack-slim` and `tag` have no subcommands and stay flat.

## One pipeline, exit code computed once

**Context.** The prepare → parse → run → report → exit dance was hand-copied into every `command.ts`, and each copy
recomputed the exit code on its own path — some presenters even returned it, leaking control-flow policy into the human
presenter. Only `audit` had factored the dance into a descriptor and runner, and nothing else reused it.

**Decision.** The dance lives once in `core/cli/command-pipeline.ts`. A command supplies a `CommandPipeline` descriptor
of typed slots — `prepare`, `schema`, `buildRequest`, `run`, `presentHuman` / `formatJson`, `exitCode`, plus optional
`guard` and `createPresenter` — and the pipeline runs them, parses global options uniformly, and computes the exit code
exactly once from the run result; `present*` functions return `void`. `arrange group` is the deliberate exception: a
pure token-string transform with no workspace prelude and a variadic positional, it stays wired by hand.

**Consequences.** Adding a command is a descriptor, not a copy of the spine; the exit code has one source; global
options reach every command the same way. The optional slots (`guard` for pack-slim's working-tree check,
`createPresenter` for streaming progress) keep the shared spine from collapsing to a lowest common denominator.

## Group a command's I/O by subsystem

**Context.** `domain/` is reserved for pure logic, so a command whose work is mostly I/O pushes that work to flat files
at the command root. `tag` had target resolution, candidate discovery, the per-target runner, the since-writer and
version resolution all in one root pile, with only types under `domain/`.

**Decision.** When the root pile grows past a handful, group it by subsystem rather than by purity: `tag/target/` for
discovering and selecting what to tag, `tag/writer/` for stamping `@since`. The purity rule stays; this grouping is
orthogonal to it. Shared types stay in `domain/types.ts` because they are genuinely cross-subsystem — scattering them
would couple the subsystems through their type imports.

**Consequences.** "Where is the tagging logic?" answers by folder, not by scanning a flat root.

## `Result<T, AppError>` for recoverable failures

**Context.** A CLI's failures are mostly expected: a missing config, an unparsable file, a path outside the workspace.
Throwing for those turns every caller into a `try`/`catch` and loses the error code the exit code depends on.

**Decision.** Fallible operations return `Result<T, AppError>` (`core/result.ts`, `core/errors.ts`). `AppError` is a
plain object with a code, not an `Error` subclass, so building one costs no stack capture. One boundary,
`consumeCliAppError` in `core/cli/result-handle.ts`, turns an `err` into a formatted message and the matching exit code
(`core/exit-codes.ts`); unexpected exceptions still propagate.

**Consequences.** Domain and orchestration code never touch `process.exitCode`; only the command boundary does. Error
text is produced in one place (`formatAppError`), so `--json` and human output stay consistent.

## Presenters are output functions

**Context.** A command reports to two audiences that test differently: a human reads lines printed through `logger` (a
side effect, checked with a spy), and a script reads the `--json` string and the exit code (pure values, checked by
asserting on the return). Folding both into one file mixes an effectful presenter with a pure serializer.

**Decision.** Each command directory splits output by audience. `output.ts` (or a small `*-reporter.ts`) holds the human
`present*` functions that write through `core/logger.ts` — a plain object, so a test can `vi.spyOn(logger, "out")` — and
return `void`. `cli-result.ts` holds the machine output: the `format*JsonOutput` string builders and the `exitCodeFor*`
mappers, which take a result and return a value, touching neither `logger` nor `process`. The exit code is policy, not
presentation, so the pipeline calls `exitCodeFor*` once for both audiences rather than letting a presenter decide it.

**Consequences.** Output changes never touch orchestration; the `--json` shape and the exit-code rule are unit-tested
without a spy. `command.ts` carries no serialization or exit-code logic of its own — the pipeline calls the two output
modules.

## Parse TypeScript with `oxc-parser`

**Context.** `arrange` and `tag` read and rewrite TypeScript source. The classic `typescript` compiler API was the only
consumer of that runtime in the repository once the build moved to native TypeScript 7.

**Decision.** AST work (`arrange/domain/ast/`, `tag`) uses `oxc-parser`; edits are applied as text ranges
(`core/source-text-edit.ts`) rather than by printing a transformed AST, so untouched code keeps its formatting byte for
byte.

**Consequences.** Nothing in the repository depends on the classic `typescript` runtime. The trade is that the CLI reads
syntax only — it never type-checks — which is all `arrange` and `tag` need.

## Audits are read-only and mechanical

**Context.** `audit rtl`, `audit links`, `audit comments`, `audit imports` and `audit display-names` gate CI. A gate
that needs judgment to interpret, or that can only be fixed by hand, is ignored under time pressure.

**Decision.** Every audit reports a location and a one-line reason, exits non-zero on any finding, and where the fix is
mechanical offers `--fix` (comment dividers) so a red run is one command from green. Allowlists live in
`codefast.config.js`, never in the audited files.

**Consequences.** Audits stay cheap to keep on; a new rule has to come with a precise detector or it does not ship.

## Naming

**Context.** Suffixes such as `.port.ts`, `.adapter.ts`, `.domain-service.ts`, `.value-object.ts` and `.coordination.ts`
described the pattern a file played in the old architecture, not what the file contained.

**Decision.** Two kinds of file, two naming rules. A **pipeline-role file** — the fixed slot every command and
subcommand repeats — carries its role name: `command.ts` (Commander wiring), `cli-schema.ts` (argv), `prepare.ts`
(prelude), `run*.ts` (orchestrator), `output.ts` (the human `present*` functions), `cli-result.ts` (machine output).
Every **other** file is named for the one concept it holds: `grouping.ts`, `token-classifier.ts`, `exports.ts`. The only
reserved suffix is `.test.ts`; Zod schemas are named for what they parse (`cli-schema.ts`, `core/config/schema.ts`).
Directory names are the five commands plus `core/`, and a command's pure logic lives under its `domain/`. The role wins
at a role slot: a subcommand whose work reads as "analyze" still names its orchestrator `run.ts` and keeps the concept
in `domain/analyze-service.ts` — the file that touches the `Filesystem` and returns a `Result` is `run*`, not the verb
it computes. The orchestrator is `run*`, never `sync`: `sync` reads as "synchronous" (these functions are async) and is
kept only where it is the domain verb, as in `mirror` syncing `package.json` exports.

**Consequences.** A filename says what a module does; the directory says which command it belongs to; and the same role
answers to the same name in every command.

## Tests

**Context.** With no container, a test calls the function it targets.

**Decision.** Unit tests live under `tests/unit/`, mirroring `src/`, and run in Node. Filesystem-touching code is tested
against fixture inputs under `tests/unit/support/`; output through spies on `logger`. There is no mocking layer for
infrastructure.

**Consequences.** Adding a test means importing a function and asserting on a `Result`. Coverage is enforced by the
workspace's `test:coverage` gate, not by this document.

## Simplify preserves cn() precedence; the className fold is type-gated and opt-in

**Context.** The mixed-`cn()` branch of `simplify` moved every static literal to the front of the call. Argument order
in `cn()` is tailwind-merge precedence — a later argument overrides an earlier one — so hoisting an override string
ahead of a variant call silently changed which utilities won, dropping the very override the trailing string existed to
apply. Separately, the idiomatic way to override a variant is its own `className` option, not a `cn()` wrapper around
it, and a codemod that produced the wrapper form left the tidier call unwritten.

**Decision.** Two rules. The base pass coalesces only _adjacent_ static literals and never reorders arguments, so
precedence is preserved and a lone static after a dynamic argument is left alone. Folding `cn(variant({…}), …overrides)`
into `variant({…, className: …})` is a separate capability behind `--fold-variant-classname`. It fires only when the
native TypeScript type server (`typescript/unstable/sync`) confirms the callee's first-parameter options accept a
`className`/`class` of the right shape — string for a single static override, a class array for a dynamic or multi-part
one. Detection is by type, never by name: a call the type server does not recognize as a variant function is left
untouched.

**Consequences.** The default pass stays oxc-only, synchronous, and workspace-free; the fold is the one path that spawns
the type server and needs the target inside a `tsconfig`, so `typescript` is an optional peer and files outside a
project keep the base pass. A cheap syntactic pre-scan gates that cost: the type server is queried only for a file that
actually contains a `cn(variant({…}), …)` call, so a directory of hundreds of files loads a project once for the few
that qualify rather than once per file. The type sees the option's shape but not the variant's `twMerge` setting, so a
variant configured `twMerge: false` would merge a folded `className` differently than the `cn()` it replaced — accepted
as out of scope, since the option-type gate already excludes non-variant callees and the shipped variants use the
default merge.

## License

Released under the [MIT License](./LICENSE).
