# @codefast/cli

`codefast` is a small, dependency-light CLI for TypeScript projects — a **pnpm workspace** or a **single package**. It
generates `package.json#exports` from a package's built `dist/`, prepares the npm tarball at publish time, stamps
`@since` on your public API, and audits a handful of source and documentation conventions.

It was built for — and is exercised daily by — the [codefast monorepo](https://github.com/codefastlabs/codefast), but
nothing here is codefast-only: run it in any pnpm workspace, or in a standalone package, and it works. A few audits
encode an opinionated house style (called out below) that you can adopt, turn off, or narrow with an allowlist.

[![npm version](https://img.shields.io/npm/v/@codefast/cli)](https://www.npmjs.com/package/@codefast/cli)
[![license](https://img.shields.io/npm/l/@codefast/cli)](./LICENSE)

## One command model

Commands are named `namespace:action`, as Laravel's Artisan names them — the thing a command acts on, then what it does
to it — and every command behaves the same way:

- **One argument.** Every command takes an optional `[target]`: a file or directory inside the project root, resolved
  against the working directory. With none, a command uses the target its config section names, else the project root. A
  command that acts on packages reaches every package under the target, or the one package holding it.
- **The same options.** `--json` prints one JSON document on stdout instead of the human report; `-v, --verbose` adds
  the stack trace behind an unexpected failure. A command that writes takes `--dry-run`; an audit takes `--fix`.
- **The same report.** Something a person must look at is a finding at `file:line`, printed as `line: text → message`
  under its file. What a writing command did to a package is one row — `✎` changed, `✓` unchanged, `○` skipped, `✗`
  failed. Every command ends with one summary line.
- **The same exit codes.** `0` passed, `1` the run finished and reports a failure, `2` the run could not happen.
- **The same config.** One `codefast.config.*` at the project root, a section per namespace.

## Requirements

- **Node.js ≥ 24.15** (the CLI is published as ESM).
- **TypeScript ≥ 7** to type-check a config written with `defineConfig`, and for `audit:props`, the one command that
  loads `typescript` (an optional peer).
- **A project root — workspace or single package.** The nearest `pnpm-workspace.yaml` above the working directory marks
  a **workspace**, whose packages are the ones it lists; with no workspace file, the nearest `package.json` marks a
  **single package**, which is the whole scope. pnpm is not needed to _run_ the CLI — npm, npx or plain `node` are fine.

## Install

```bash
pnpm add -D @codefast/cli
pnpm exec codefast
```

Or run it once without installing, with `pnpm dlx @codefast/cli` or `npx @codefast/cli`. The package is published on the
`0.x` line and versioned on its own track: **breaking changes ship as minor versions**, so pin the minor
(`@codefast/cli@~0.16.0`) when you need stability.

## Commands

Run bare, `codefast` lists its commands, as `php artisan` does; `--help` on any command shows its usage, and
`codefast --version` prints the installed version.

| Command               | What it does                                                                | Writes?           |
| --------------------- | --------------------------------------------------------------------------- | ----------------- |
| `exports:generate`    | Write each package's `package.json#exports` from its built `dist/`          | yes (`--dry-run`) |
| `publish:prepare`     | Strip the development surface from published packages right before publish  | yes (`--dry-run`) |
| `since:stamp`         | Stamp `@since <version>` on exported declarations that lack one             | yes (`--dry-run`) |
| `audit`               | Run every audit and report each under its name                              | `--fix` only      |
| `audit:links`         | Markdown links pointing at a missing path or anchor                         | no                |
| `audit:rtl`           | Physical-direction Tailwind classes that should be logical                  | no                |
| `audit:imports`       | Banned import forms (React imports that are not named-only, Zod by name)    | no                |
| `audit:assertions`    | Double type assertions through `unknown` / `any`, tests included            | no                |
| `audit:display-names` | `token()` / `tag()` / module names breaking the `namespace:Name` convention | no                |
| `audit:props`         | Props types joined with `&` that an interface could express                 | no                |
| `audit:publish`       | What would break a consumer's install of a published package                | no                |
| `audit:engines`       | Node floors (`engines.node`) that do not hold                               | no                |
| `audit:layers`        | Value imports that point up a package's configured layers                   | no                |
| `audit:comments`      | Doc-comment conventions; `--fix` repairs section dividers                   | `--fix` only      |

`exports:generate`, `publish:prepare`, `since:stamp`, `audit:links`, `audit:assertions`, `audit:layers`, `audit:publish`
and `audit:engines` are general-purpose. The other audits encode codefast's own house style (logical Tailwind
directions, named React imports, a comment grammar, a `namespace:Name` scheme for `@codefast/di` tokens, interfaces for
component props): adopt them, or turn one off with `audit: { rtl: false }`.

The global `--no-color` flag comes before the command name — `codefast --no-color exports:generate`. Color is also off
when stdout is not a terminal or `NO_COLOR` is set, and `FORCE_COLOR` turns it back on.

## `exports:generate`

Scans each package's built `dist/` and writes its `package.json#exports` map, plus `main`, `module` and `types` mirrored
from the root export and a `files` entry for `dist`. It writes a manifest only when its content changes, so a run
reports each package as changed or unchanged; a package with no `dist/` is skipped, so **build first**.

```bash
codefast exports:generate                  # every package
codefast exports:generate packages/ui      # one package
codefast exports:generate --dry-run        # report what would change, write nothing
```

### Per-package `exports` configuration

The `exports` section is a record keyed by package name or glob — the exact name wins over a glob. Set a package to
`false` to skip it; a package nothing names uses the defaults. For a package you do configure, these keys apply:

- **`source`** (`boolean | string`, default `true`) — emit a `source` condition pointing at the original `.ts`, so a
  consumer that enables `source` resolves your `src/`. A string sets the root export's source path explicitly.
- **`types`** (`boolean`, default `true`) — emit `types` when a matching `.d.ts` exists.
- **`import`** (`boolean`, default `true`) — emit the `import` condition.
- **`preserve`** (`boolean`) — keep the existing `exports` map as written and only fill in missing `source` / `types` /
  `import` conditions; no `dist/` scan runs, so the public surface stays exactly what you declared.
- **`strip`** (`string`) — a `dist/` path prefix to flatten out of the specifiers, so `./components/button` publishes as
  `./button`.
- **`exclude`** (`string[]`) — specifiers to leave out, matched after `strip`; a trailing `/*` excludes a subtree. The
  root export and `./package.json` are never excluded.
- **`exports`** (`Record<string, string>`) — extra or overriding entries the `dist/` scan does not produce, such as a
  raw CSS source path.
- **`css`** (`boolean | { enabled?, forceExportFiles?, customExports? }`) — how CSS files in `dist/` become exports.

## `publish:prepare`

Slims each published package down to what a consumer's `tsc` and Node read, so the tarball ships `dist` and any `src`
subtree an export still points into. Where `exports:generate` writes the full exports — the `source` condition included
— for local development, `publish:prepare` removes that lane for publish: the rest of `src` in `files`, every `source`
condition in `exports`/`imports`, every `imports` entry left pointing outside `files`, every script that is not an
install or publish lifecycle hook, `devDependencies`, and the `dist` source maps with their dangling `sourceMappingURL`
directives. Private packages are skipped.

It is meant for an ephemeral CI checkout right before `changeset publish`, so its result is **never committed**. It
refuses to write over uncommitted tracked changes; `--dry-run` writes nothing, so it is exempt, and `--force` overrides
the guard.

```bash
codefast publish:prepare                   # every published package
codefast publish:prepare packages/ui       # one package
codefast publish:prepare --dry-run         # report what would be dropped
```

## `since:stamp`

Adds `@since <version>` to the doc comments of exported declarations that lack one, creating the doc block when there is
none, in each package's `src` (or the package itself when it has none). The version is the package's own. Overload
signatures are stamped one by one, because the `.d.ts` keeps every overload's doc block. Run it at release time, so
published APIs carry accurate versions — never hand-write `@since`.

A declaration with no doc block and a `//` comment on the line above it is reported as a finding instead: a block
written there would stack under a note or split a directive from the code it governs. Its file is left as it is, and the
run fails, since a later run could only stamp a version that did not introduce it.

```bash
codefast since:stamp                       # every package
codefast since:stamp packages/ui/src       # one directory or file
codefast since:stamp --dry-run             # report what would be stamped
```

The `since` section is a record keyed by package name or glob, `false` skipping the packages it matches:
`since: { "@apps/*": false }`.

## `audit`

Every audit reports findings at `file:line`, exits `1` while any remain — so it gates CI with no extra glue — and takes
the same config section:

- `audit.<name>: false` turns the audit off in a full `audit` run;
- `audit.<name>.target` is the target it scans when the command line names none;
- `audit.<name>.allowlist` accepts findings: each entry is a finding's text as written, accepted everywhere, or
  `path:text` for one file.

The section key is the audit's name in camelCase (`audit.displayNames`). Every audit takes `--fix`, which applies the
mechanical fixes its findings carry — today, `audit:comments` repairs section dividers.

Run bare, `codefast audit` runs every audit and reports each under its name, so one CI step shows every failing audit
rather than only the first. A `[target]` there is the target of every audit. It exits `2` when an audit could not run,
`1` when any reported findings, `0` otherwise.

```bash
codefast audit                             # every audit, one report
codefast audit packages/di                 # every audit over one package
codefast audit --json                      # one document, each audit under result.audits
```

### `audit:links`

_General-purpose._ Markdown cross-references that point at nothing: a relative path that does not exist, an in-document
anchor with no matching heading or `<a id>`, and an anchor into another document that the target does not offer — the
case a browser fails silently by scrolling to the top. External URLs are not checked, and links inside fenced code are
examples, not references. A finding's text is the link target as written.

### `audit:rtl`

_House style._ Physical-direction Tailwind classes (`ml-*`, `left-*`, `text-left`) that should use a logical equivalent
(`ms-*`, `start-*`, `text-start`) or an `rtl:` companion (`translate-x`, `space-x`, resize cursors). A finding's text is
the class token.

### `audit:imports`

_House style._ The import policy over `.ts`/`.tsx` files:

- **React** — members are imported by name. It flags `import * as React`, a default `React` import (type-only included),
  and an implicit `React.*` UMD-global type reference (`e: React.FormEvent` with no import) that `tsc` accepts silently.
- **Zod** — a named `import { z } from "zod"`, which pins Zod's full locale set into a bundle;
  `import * as z from "zod"` lets bundlers tree-shake it.

A finding's text is the offending source text.

### `audit:assertions`

Every double type assertion through `unknown` or `any`, tests included — `x as unknown as T`, `(x as unknown) as T`,
`<T><unknown>x` and the `any` spellings. The pair tells the compiler two types are unrelated and silences it anyway; no
oxlint rule targets it. Make the types agree, narrow with a type guard, or — where the erasure is the point — keep it
with a directive that states why, on its line or the line above:

```ts
// codefast-allow-double-assertion: the host stores each plugin's config untyped; the plugin owns its shape
const config = host.configFor(plugin.id) as unknown as PluginConfig;
```

A directive with no reason, or one that keeps no assertion, is itself reported, so a kept assertion cannot outlive its
cause.

### `audit:display-names`

_House style._ The display-name convention for every string a `token()`, `tag()` or module factory takes: a name is
spelled like the TS symbol it stands for, under its owner's namespace — `namespace:Name`. A token or module name is
PascalCase, a tag key camelCase. It scans TypeScript and markdown alike, since a doc sample is what a reader copies, and
skips `tests/`, `benchmarks/`, `.changeset/` and `CHANGELOG.md`.

### `audit:props`

Every `*Props` type alias joined with `&` that an interface could express — at the alias's top level or passed to the
type it wraps — and every module-level component in a `.tsx` file whose first parameter is annotated inline with one. An
interface checks its members against every base where it is declared (TS2430, or TS2320 between two bases); `&`
intersects them silently and a narrowed prop fails only at a call site.

Whether a part can be extended is the type checker's call: the audit asks the native TypeScript type server what each
part resolves to, and keeps the `&` when one is a union, a type parameter or a mapped type over one, or no object at
all. A part that does not resolve is reported — on a workspace whose packages consume each other's `dist/`, build first.
The type server starts only once a file holds a candidate, and needs `typescript` (v7) resolvable from the target and a
`tsconfig.json` that includes each file.

### `audit:publish`

What would break a consumer's install of a published package, while it can still be fixed:

- a `#/`-prefixed internal import, which Node's ESM resolver rejects before 24.14 while every in-repo runner accepts it;
- an `exports`/`imports` target the slimmed manifest does not ship, found by applying the same slim as
  `publish:prepare`, reported at its `package.json` line;
- a shipped stylesheet whose Tailwind `@source` paths reach none of the files the tarball ships, so the consumer's
  Tailwind registers no class names and the components render unstyled.

It reads the built output, so run it after the build; a `files` entry missing on disk is named in the finding. Private
packages are skipped.

### `audit:engines`

_General-purpose._ Each package's Node floor — its `engines.node` — against what actually runs on it, reported at the
`package.json` it concerns:

- a published package that declares no floor, or one not written `>=X.Y.Z`;
- a published package whose floor differs from the highest one any published package declares, since they ship as a set;
- a release the floor claims that a dependency's `engines.node` leaves out. A runtime dependency must admit every
  release from the floor up — the odd majors below the one `.node-version` pins aside, since they reach end-of-life
  without becoming LTS. A dev dependency only runs the package's tests, so it must admit the floor and the
  `.node-version` release. A workspace dependency is read from its manifest, any other from the package's own
  `node_modules`, so run the audit after the install;
- an `@types/node` the lockfile resolves on another major than the floor, or on a newer minor.

The workspace root's own `engines.node` is the contributors' floor: every dependency any package installs must admit it,
and each gap is reported once per dependency range. `--json` also lists every floor under `result.floors`, with its
package directory, which is enough to plan the CI leg that runs on it.

### `audit:layers`

_General-purpose._ Holds a package's `src/` to the layering its architecture states. You list the layers bottom to top,
each naming the families directly under the root — a directory, or a lone module (`errors.ts`) — and the audit reports
every value import or re-export that points up the list, plus every module no layer places. Type-only imports couple
nothing, so they may point anywhere; a dynamic `import()` counts as a value import.

```js
// codefast.config.js
export default {
  audit: {
    layers: {
      packages: {
        "@acme/di": {
          root: "src", // where the layers sit, relative to the package (default)
          layers: [["core", "errors.ts"], ["engine"], ["container"], ["index.ts"]],
        },
      },
    },
  },
};
```

A configured package name the workspace does not hold, a layer entry nested below the root, and a family placed twice
are refused before anything is scanned.

### `audit:comments`

_House style._ Doc-comment conventions. Section dividers not in the one allowed form are mechanical, so `--fix` rewrites
them in place, before the scan reports what is left. The rest is for a person to fix: TSDoc grammar errors, JSDoc
`{type}` payloads, comments pointing at repo documents, `@param` lists that name some parameters but not all, `@param`
descriptions without the `-` separator, `@since` tags out of position or naming a version the package has not reached,
and `{@link}` targets nothing declares.

## Configuration

**You do not need a config file.** Every command works with none. To change a default, add one `codefast.config.*` at
the project root — `.ts`, `.mts`, `.js`, `.mjs`, `.cjs` or `.json`; two of them is an error. A JS or TS config is loaded
through [jiti](https://github.com/unjs/jiti), so **only run the CLI in repositories you trust**. The schema is strict:
an unknown key is an error, which catches typos at once.

| Key          | Configures                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `exports`    | `exports:generate`, per package — see [per-package config](#per-package-exports-configuration) |
| `since`      | `since:stamp`: the packages it skips                                                           |
| `audit`      | every audit: `false`, or its `target` and `allowlist`                                          |
| `afterWrite` | a hook every writing command calls with the files it wrote                                     |

Import `defineConfig` (or annotate with `CodefastConfig`) and your editor completes and checks every key:

```ts
// codefast.config.ts
import { execSync } from "node:child_process";

import { defineConfig } from "@codefast/cli";

export default defineConfig({
  exports: {
    "@acme/ui": { strip: "./components/", exports: { "./css/*": "./src/css/*" } },
    "@apps/*": false,
  },
  since: { "@apps/*": false },
  audit: {
    rtl: { target: "packages/ui/src", allowlist: ["packages/ui/src/sheet.ts:slide-in-from-left-10"] },
    props: false,
  },
  // Called after any command wrote files — exports:generate, publish:prepare, since:stamp, an audit's --fix.
  afterWrite: ({ files }) => execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" }),
});
```

`afterWrite` receives the command name and the absolute paths it wrote, and never runs on a dry run; a hook that throws
fails the run with exit `1`. Only a JS or TS config can hold it.

## JSON output

`--json` prints one document on stdout, shaped the same for every command:

```json
{
  "schemaVersion": 3,
  "command": "audit:links",
  "ok": false,
  "rootDir": "/repo",
  "target": ".",
  "elapsedSeconds": 0.12,
  "result": {
    "findings": [{ "file": "README.md", "line": 3, "text": "./missing.md", "message": "path does not exist" }],
    "scannedFiles": 158,
    "scannedPackages": 0,
    "fixedFiles": [],
    "allowlisted": 0
  }
}
```

`result` is the command's report: an audit's findings as above, a full `audit` run's `audits` (each with its `status` —
`clean`, `findings`, `skipped` or `error`), or a writing command's `packages`, one outcome each. A run that could not
happen prints `{ "schemaVersion": 3, "command", "ok": false, "error": { "code", "message" } }` instead, and warnings go
to stderr, so stdout always parses.

## Exit codes

| Code | Meaning                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------ |
| `0`  | Success.                                                                                               |
| `1`  | The run finished and reported a failure: findings, a package that failed, a failed `afterWrite` hook.  |
| `2`  | The run could not do its job: an unknown command or option, invalid config, a missing target, a crash. |

A script can tell "the code needs fixing" (`1`) from "the tool or its invocation needs fixing" (`2`).

## Programmatic use

`runCli` runs the same CLI in-process and resolves to the exit code it would have exited with — the `codefast` binary is
a thin wrapper around it. The command still writes its output to stdout and stderr; read stdout yourself for the JSON.

```ts
import { runCli } from "@codefast/cli";

// `argv` follows the `process.argv` layout: the first two entries are ignored.
const exitCode = await runCli(["node", "codefast", "exports:generate", "--dry-run", "--json"]);
```

## How the codefast monorepo uses it

The monorepo runs the CLI from its built output through root `package.json` scripts, each named `cli:` plus the command:

```bash
pnpm run codefast <command>         # node ./packages/cli/dist/bin.js
pnpm cli:audit                      # codefast audit — what CI runs
pnpm cli:audit:links                # codefast audit:links, and one script per audit
pnpm cli:exports:generate           # codefast exports:generate
```

`pnpm run version-packages` runs `changeset version` and then `codefast since:stamp`, so published APIs are stamped at
release, and the release workflow runs `codefast publish:prepare` before `changeset publish` on a clean CI checkout.

## Documentation

- [codefastlabs.com/docs/cli](https://codefastlabs.com/docs/cli) — this document, rendered.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the package is laid out: the command model, the workspace and target, the
  finding model.
- [`DECISIONS.md`](./DECISIONS.md) — the design decisions that shape the package and the reasons behind them.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for every published version.

## Contributing

The package is developed in the [codefast monorepo](https://github.com/codefastlabs/codefast); the repo-wide
[contributing guide](../../CONTRIBUTING.md) covers setup, the test taxonomy, and the release flow.

## License

Released under the [MIT License](./LICENSE).
