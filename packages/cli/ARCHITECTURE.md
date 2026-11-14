# CLI package architecture

The `@codefast/cli` package is a **small Node CLI**. Its commands are named `namespace:action`, as Laravel's Artisan
names them — `audit` and `audit:<name>`, `exports:generate`, `publish:prepare`, `since:stamp` — and every one of them
runs through **one command model**. Behaviour is wired with **plain functions**, **Commander** parses argv, and
**`Result<T, AppError>`** carries recoverable failures.

## One command model

A command is a [`CommandSpec`](src/core/command.ts): its name and description, the help for its one `[target]`, the
boolean flags it takes, a `run`, a `verdict` over its report, and a `present` for a human. Everything else is written
once, in [`core/command.ts`](src/core/command.ts), and no command repeats any of it:

1. **The workspace.** [`loadWorkspace`](src/core/workspace/workspace.ts) resolves the project root from the working
   directory, loads the root's one `codefast.config.*`, and reads every package manifest once. A command never resolves
   a root, loads a config or parses a `package.json` of its own.
2. **The target.** [`resolveTarget`](src/core/target.ts) turns the `[target]` argument into a path inside the root: the
   given path against the working directory, else the target the config names for the command, else the root. A command
   that acts on packages reaches them through `packagesInTarget`; one that reads files walks the target.
3. **The run.** `run(context)` receives the workspace, the target and the flags, and returns a report or an `AppError`.
4. **The afterWrite hook.** When the run wrote files and `writtenFiles` lists them, the config's `afterWrite` hook
   receives them; a hook that throws fails the run.
5. **The output.** `--json` prints one document on stdout, shaped the same for every command —
   `{ schemaVersion, command, ok, rootDir, target, elapsedSeconds, result }`, or `{ …, ok: false, error }` when the run
   could not happen. Without it, `present` prints the report and ends with the one summary line every command ends with.
6. **The exit code.** The `verdict` is `pass`, `fail` or `error`, and maps to `0`, `1` or `2`; every `AppError` is `2`.

The vocabulary a report is written in is shared too, in [`core/report.ts`](src/core/report.ts): a `Finding` is something
at a `file:line` a person must look at, and a `PackageOutcome` is what a writing command did to one package — `changed`,
`unchanged`, `skipped` or `failed`. Their presenters draw the same marks in every command.

## One finding model for the audits

An audit is an [`Audit`](src/audit/domain/types.ts): a name, its config section and a `scan`. The scan is the audit's
own — which files or packages it reads and what it detects there — and it returns an `AuditScan`: the findings, what it
scanned, and the files `--fix` rewrote. Everything after the scan is written once in
[`audit/command.ts`](src/audit/command.ts): the allowlist from the audit's config section
([`applyAllowlist`](src/audit/domain/findings.ts)), the `audit:<name>` command, the verdict (any finding fails), the
presenter ([`audit/output.ts`](src/audit/output.ts)), and the bare `audit` that runs them all. A detector states what it
found as a `Detection` — `line`, `raw` text, `reason` — and the run places it in its file.

## Layout (`src/`)

| Area                               | Role                                                                                                                                                                                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`bin.ts`](src/bin.ts)             | Process entry: runs `runCli` and sets `process.exitCode`, never `process.exit`, which cuts a piped stdout short.                                                                                               |
| [`cli.ts`](src/cli.ts)             | Composition root: the program, `--no-color`, and one `createCommand` per spec; run bare, it lists the commands.                                                                                                |
| [`core/`](src/core/)               | The command model, the workspace and target, the report vocabulary, `Result` and `AppError`, the filesystem port, `logger` and `paint`, and the AST helpers.                                                   |
| [`core/config/`](src/core/config/) | The strict Zod schema, the loader, `defineConfig`, and the selector that reads a per-package record by name or glob.                                                                                           |
| [`audit/`](src/audit/)             | `audit` and every `audit:<name>`: one directory per audit holding its `Audit` (`command.ts`), its scan (`run.ts`) and its pure `domain/` detectors; the allowlist, the presenters and the full run are shared. |
| [`exports/`](src/exports/)         | `exports:generate`: one package's sync in `sync-package.ts`, the writers, and the export-map generation in `domain/exports.ts`.                                                                                |
| [`publish/`](src/publish/)         | `publish:prepare`: the working-tree guard and the pure manifest slim in `domain/transform.ts`, which `audit:publish` applies too.                                                                              |
| [`since/`](src/since/)             | `since:stamp`: the run over each package's source and the `@since` writer under `writer/`.                                                                                                                     |

A command directory holds `command.ts` (its spec), `run.ts` (the orchestrator), `output.ts` (its presenter) and
`domain/` (pure logic and its report types); a file that fits none of those is named for the one concept it holds.

## Boundaries

- **Domain modules** (`*/domain/**`) stay pure: no Commander, no `process`, no `logger` — only types and algorithms.
- **Runs** take a `CommandContext` and return a `Result`; they never print, and never touch `process.exitCode`.
- **Presenters** print through `logger` and return `void`; the `--json` document and the exit code belong to the
  pipeline, which reads both off the report.
- **Zod** validates what crosses in from outside — the config file — never a value the CLI builds itself.

## Imports

Internal code uses the `#…` alias (see `package.json#imports`): `#core/…`, `#audit/…`, never a deep relative path.

## Testing

Tests live under [`tests/`](tests/) only, in the workspace's four categories. A unit test drives a run over
[`createMemoryFilesystem`](tests/unit/support/memory-filesystem.ts) through the same `loadWorkspace` and `resolveTarget`
the pipeline uses ([`createCommandContext`](tests/unit/support/command-context.ts)); what needs a real disk — a JS
config, the type server, the built binary — is an integration or e2e test over a temporary directory.

## Further reading

- Product behaviour and commands: [`README.md`](README.md).
- Design decisions and their reasons: [`DECISIONS.md`](DECISIONS.md).

## License

Released under the [MIT License](./LICENSE).
