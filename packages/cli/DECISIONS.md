# `@codefast/cli` — design decisions

The choices that shape this package and the reasons behind them. [`ARCHITECTURE.md`](./ARCHITECTURE.md) describes the
resulting layout; [`README.md`](./README.md) describes what the commands do. Each decision below still holds; a decision
that stops holding gets replaced here, not annotated.

## Commands are named `namespace:action`

**Context.** `mirror`, `pack-slim` and `tag` named a metaphor, not what they act on: a reader could not tell from
`codefast tag` that it stamps `@since` on exported declarations, and an audit hid behind a subcommand of `audit`.

**Decision.** Every command is named as Laravel's Artisan names one: the thing it acts on, a colon, and what it does to
it — `exports:generate`, `publish:prepare`, `since:stamp`, `audit:links`. A namespace that has an obvious whole-run
action keeps a bare command for it, as `migrate` sits beside `migrate:status`: `audit` runs every `audit:<name>`. A
config section is named for the namespace it configures (`exports`, `since`, `audit`), and a source directory for the
namespace too.

**Consequences.** `codefast --help`, sorted, groups the commands by what they act on, and a new command's name is
decided by the same rule rather than by taste. Run bare, `codefast` lists them and exits `0`, as `php artisan` does.

## One command model

**Context.** Every command resolved its own project root — four ways, one of them falling back to the working directory
when none was found — loaded the config on its own, parsed `package.json` files of its own, read its positional as a
`[package]` or a `[target]`, printed `--json` in one of two shapes, sent errors under `--json` as text to stderr, and
printed config warnings to stdout, into the JSON a script was parsing.

**Decision.** A command is a `CommandSpec` — name, target help, flags, `run`, `verdict`, `present` — and the rest is
written once in `core/command.ts`: the workspace (root, config, every manifest) loaded once, the one `[target]` resolved
by one rule, the `--json` document every command prints, the error report, the `afterWrite` hook and the exit code.
Diagnostics go to stderr, so stdout carries only the report. A report is written in a shared vocabulary: a `Finding` at
a `file:line`, and a `PackageOutcome` of `changed`, `unchanged`, `skipped` or `failed`.

**Consequences.** Two commands cannot drift apart on anything the pipeline owns, because neither writes it. A command
that writes files lists them, so the `afterWrite` hook reaches every writer rather than one. Streaming progress went:
every command reports once its run returns, as the audits always did.

## A writing command writes only what changed

**Context.** `exports:generate` rewrote every `package.json` it touched, changed or not, so a run could not say which
packages it changed and a formatter hook would have reformatted files nobody edited.

**Decision.** A writer compares what it would write with what is on disk and writes only on a difference; the outcome
says `changed` or `unchanged`, and a dry run reports the same outcome without writing.

**Consequences.** The report of a writing command is the list of files it changed, which is also what the `afterWrite`
hook receives.

## The config lives at the project root, once

**Context.** The loader walked up from the root, took the first of several file names silently, cached one load per
directory for the life of the process, and ignored `codefast.config.ts` although the README taught it.

**Decision.** The config is the one `codefast.config.{ts,mts,js,mjs,cjs,json}` at the project root, loaded once per run
through jiti. Two of them is an error, not a ranking. A per-package section (`exports`, `since`) is a record keyed by
package name or glob, `false` skipping the package; the exact name wins over a glob.

**Consequences.** Which config applies is never a guess, and skipping a package is spelled the same in every section.

## Plain functions, not Explicit Architecture

**Context.** The CLI has four top-level commands (`audit` and `audit:*`, `exports:generate`, `publish:prepare`,
`since:stamp`), each a short pipeline: read files, run a pure transformation, print or write the result. An earlier
revision applied full Explicit / Hexagonal Architecture to it — a port interface per use case, an adapter per port, a DI
token per injectable, request objects for one-field inputs, and a `shell/` layer wrapping `node:fs`, `node:path`,
`process` and Commander behind eleven more ports. Roughly three files in four existed to connect the other one, and the
`@codefast/di` container resolved at runtime what a function call would have checked at compile time.

**Decision.** Behaviour is wired with plain functions. A command declares a spec whose `run` and `present` are plain
functions; domain modules export pure functions. There is no container, no module registry, no token. Node built-ins are
called through thin helpers in `core/` only where a helper adds something (a `Result`, a normalised error), never to
make them injectable.

**Consequences.** Dependencies are visible as imports and checked by `tsc`. A new command is one directory —
`command.ts` (its spec), `run.ts`, `output.ts`, `domain/` — so one command reads like the next. The cost is that
swapping an implementation for a test means passing a real path or spying on `logger`, not binding a mock — accepted,
because every infrastructure call here is cheap to exercise for real. This is the worked example the `@codefast/di`
"explicit architecture" samples cite when they say the pattern must be earned by the domain: a CLI of this size does not
earn it.

## An interface needs a second implementation

**Context.** Under the previous layout every interface had exactly one implementation, so the interface documented
nothing and guaranteed nothing; it existed because the architecture required a port.

**Decision.** An interface or abstract type is introduced only when at least two concrete implementations exist, or when
a module genuinely needs a test double that a real temp path or a `vi.spyOn` cannot provide. Pure domain code needs
none.

**Consequences.** The `core/filesystem/node.ts` helpers are functions, not an adapter behind a port; telemetry or
timing, if ever wanted, wraps a function instead of hooking a container activation.

## One directory per audit

**Context.** The audits share a run, a report and an exit rule, but each has detectors of its own; left flat, a command
directory became a pile of `run-rtl.ts`, `run-links.ts`, … beside a `domain/` holding every scan's detectors.

**Decision.** Each audit is its own directory under `audit/`, holding its `run.ts`, `output.ts` and `domain/`, and
registers as its own `audit:<name>` command. What the audits share lives once in `audit/command.ts`: one `AuditCheck`
per audit — the target its config may name, its run, its presenter, its clean rule — and the bare `audit` that runs them
all.

**Consequences.** Everything about one scan lives in one folder, and adding a scan is adding a check.

## Naming

**Context.** Suffixes such as `.port.ts`, `.adapter.ts` and `.domain-service.ts` described the pattern a file played in
an earlier architecture, not what it contained.

**Decision.** A role file carries its role name: `command.ts` (the spec), `run.ts` (the orchestrator), `output.ts` (the
`present*` functions). Every other file is named for the one concept it holds: `range-gaps.ts`, `layering.ts`,
`sync-package.ts`. The only reserved suffix is `.test.ts`.

**Consequences.** A filename says what a module does, the directory says which namespace it belongs to, and the same
role answers to the same name in every command.

## Tests

**Context.** With no container, a test calls the function it targets — and five hand-written fake filesystems had grown,
each faking a different subset.

**Decision.** A unit test runs a command over the one in-memory filesystem, through the same `loadWorkspace` and
`resolveTarget` the pipeline uses, and spies on `logger` for what a presenter prints. A JS config, the type server and
the built binary need a real disk, so they are integration or e2e tests over a temporary directory.

**Consequences.** Adding a test means building a project in memory and asserting on a `Result`. Coverage is enforced by
the workspace's `test:coverage` gate, not by this document.

## `Result<T, AppError>` for recoverable failures

**Context.** A CLI's failures are mostly expected: a missing config, an unparsable file, a path outside the workspace.
Throwing for those turns every caller into a `try`/`catch` and loses the error code the exit code depends on.

**Decision.** Fallible operations return `Result<T, AppError>` (`core/result.ts`, `core/errors.ts`). `AppError` is a
plain object with a code, not an `Error` subclass, so building one costs no stack capture. One boundary, the command
pipeline in `core/command.ts`, turns an `err` into a `[CODE] message` line — or the `error` of the `--json` document —
and exit code `2`; unexpected exceptions still propagate.

**Consequences.** Runs never touch `process.exitCode`; only the pipeline does. Error text is produced in one place
(`presentAppError`), so every command reports a failure the same way.

## Parse TypeScript with `oxc-parser`

**Context.** `since:stamp` and several audits read TypeScript source, and `since:stamp` rewrites it. The classic
`typescript` compiler API was the only consumer of that runtime in the repository once the build moved to native
TypeScript 7.

**Decision.** AST work (`since:stamp` and the audits) uses `oxc-parser`; edits are applied as text ranges
(`core/source-text-edit.ts`) rather than by printing a transformed AST, so untouched code keeps its formatting byte for
byte.

**Consequences.** Nothing in the repository depends on the classic `typescript` runtime. The trade is that the CLI reads
syntax only — it never type-checks — which is all `since:stamp` and those audits need; `audit:props`, which must judge
types, asks the type server instead.

## Audits are read-only and mechanical

**Context.** `audit:links`, `audit:comments`, `audit:imports`, `audit:assertions`, `audit:display-names`, `audit:props`,
`audit:rtl`, `audit:layers` and `audit:publish` gate CI. A gate that needs judgment to interpret, or that can only be
fixed by hand, is ignored under time pressure.

**Decision.** Every audit reports a location and a one-line reason, exits non-zero on any finding, and where the fix is
mechanical offers `--fix` (comment dividers) so a red run is one command from green. Allowlists live in
`codefast.config.js`, never in the audited files.

**Consequences.** Audits stay cheap to keep on; a new rule has to come with a precise detector or it does not ship.

## `audit:props` judges by type, through the type server

**Context.** Whether a props alias written `A & B & { … }` could be an interface depends on what each part resolves to:
an interface cannot extend a union or a type parameter (TS2312), and for a union the `&` is the point, since it
distributes over the members. Syntax cannot tell `ComponentProps<"div">` from `ComponentProps<typeof DayPicker>`, and a
name list or a disable comment for the second kind would rot the first time a primitive's props changed shape.

**Decision.** `oxc-parser` finds the candidates — every `*Props` alias joined with `&`, at its top level or passed to
the type it wraps, and in a `.tsx` file a module-level component's first parameter annotated inline with one — and the
native TypeScript type server classifies each part from its type node: an object (or an intersection of objects) can be
extended; a union, a type parameter, a mapped type over a type parameter, or anything that is not an object keeps the
`&`. A part that does not resolve is reported, never passed.

**Consequences.** The audit needs no allowlist for the forms that must stay a `type`, and it follows a dependency that
turns its props into a union without anyone editing a list. Like the `className` fold, it is the type server's cost only
for files that hold a candidate, and it needs `typescript` (v7) and a `tsconfig.json` over the scanned files.

## Exit `1` for a failing result, `2` for a run that could not happen

**Context.** Audit findings, a missing target, a crash and an unknown command all exited `1`, so a CI job could not tell
code that needs fixing from a tool or invocation that does. Commander also exited on its own, past the pipeline.

**Decision.** `1` means the run finished and its result fails — findings, an errored package, a failed hook. `2` means
the run could not do its job: every `AppError`, whatever its code, and every usage error Commander raises, which
`runCli` catches through `exitOverride` on the whole command tree. A full `audit` run ranks `2` above `1`, through a
`verdict` of `error`.

**Consequences.** A script reads the class of failure from the code alone. `bin.ts` sets `process.exitCode` rather than
calling `process.exit`, which would end the process before a piped stdout drains.

## License

Released under the [MIT License](./LICENSE).
