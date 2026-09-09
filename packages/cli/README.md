# @codefast/cli

`codefast` is a small, dependency-light CLI toolkit for TypeScript projects — a **pnpm workspace** or a **single
package**. It reorders Tailwind classes, generates `package.json#exports` from a package's built `dist/`, slims the npm
tarball at publish time, stamps `@since` on your public API, and audits a handful of source and documentation
conventions.

It was built for — and is exercised daily by — the [codefast monorepo](https://github.com/codefastlabs/codefast), but
nothing here is codefast-only: run it in any pnpm workspace, or in a standalone package, and it works. A few audits
encode an opinionated house style (called out below) that you can adopt, ignore, or narrow with an allowlist.

[![npm version](https://img.shields.io/npm/v/@codefast/cli)](https://www.npmjs.com/package/@codefast/cli)
[![license](https://img.shields.io/npm/l/@codefast/cli)](./LICENSE)

## Design principles

- **Safe by default.** Every writing command supports `--dry-run`, and every audit is read-only except
  `audit comments --fix`.
- **Scriptable.** `--json` prints one JSON object on stdout and suppresses the human progress output.
- **CI-ready.** Audits exit non-zero when findings remain, so they gate a pipeline with no extra glue.
- **Configurable.** An optional `codefast.config.*` file, validated by a strict schema, adjusts every command.

## Requirements

- **Node.js ≥ 24** (the CLI is published as ESM).
- **A project root — workspace or single package.** Commands resolve their root by walking up from the current
  directory: the nearest `pnpm-workspace.yaml` marks a **workspace** (every package under it is in scope), and with no
  workspace file the nearest `package.json` marks a **single package** (that one package is the whole scope). Only
  `arrange group` needs no project at all — it just formats a string you paste in.
- **pnpm is not required to _run_ the CLI** — npm, npx, or a plain `node` invocation are all fine. pnpm matters only for
  workspace-wide behavior, which is keyed off `pnpm-workspace.yaml`.

## Install

Install it globally, or run it once without installing:

```bash
# global install (pick your package manager)
pnpm add -g @codefast/cli
npm install -g @codefast/cli

# one-off, no install
pnpm dlx @codefast/cli --help
npx @codefast/cli --help
```

As a project dev dependency:

```bash
pnpm add -D @codefast/cli
pnpm exec codefast --help
```

The package is published on the `0.x` line and versioned on its own track: **breaking changes ship as minor versions**,
so pin the minor (`@codefast/cli@~0.9.0`) when you need stability.

## Quick start

```bash
codefast --help                                   # list commands
codefast arrange group "flex h-10 w-full rounded-md bg-primary"   # works anywhere, no project needed

# in a workspace or a single-package project:
codefast arrange inspect packages/ui/src          # read-only report of arrange findings
codefast arrange --dry-run packages/ui/src        # preview a class reorder
codefast mirror --dry-run                          # preview generated exports for each package in scope
codefast audit links                               # find broken markdown cross-references
```

## Global options and conventions

- `codefast --help` lists the commands, and `--help` on any command shows its usage; `codefast --version` prints the
  installed version.
- **The global `--no-color` flag must come _before_ the command name** — `codefast --no-color mirror`, not
  `codefast mirror --no-color`.
- **Writing commands write by default; pass `--dry-run` to preview.** The audits are read-only — the one exception is
  `audit comments --fix`, which repairs section dividers in place.
- **`--json` prints a single JSON object on stdout** and suppresses the human-readable progress output, so any command
  can gate a script or a CI job.

## Commands at a glance

| Command               | What it does                                                               | Writes?           |
| --------------------- | -------------------------------------------------------------------------- | ----------------- |
| `arrange`             | Regroup Tailwind classes in `cn()` / `tv()` calls in render-pipeline order | yes (`--dry-run`) |
| `mirror`              | Write each package's `package.json#exports` from its built `dist/`         | yes (`--dry-run`) |
| `pack-slim`           | Strip the dev-only surface from a package right before publish             | yes (`--dry-run`) |
| `tag`                 | Stamp `@since <version>` on exported declarations that lack one            | yes (`--dry-run`) |
| `audit links`         | Report markdown cross-references that resolve to nothing                   | no                |
| `audit rtl`           | Report physical-direction Tailwind classes that should be logical          | no                |
| `audit imports`       | Enforce the import policy (React by-name, Zod namespace in front-end)      | no (report only)  |
| `audit comments`      | Check doc-comment conventions; repair section dividers                     | `--fix` only      |
| `audit display-names` | Enforce the `namespace:Name` display-name convention                       | no                |

**Which of these are for you?** `arrange`, `mirror`, `pack-slim`, `tag`, and `audit links` are general-purpose — they
work for any pnpm workspace or single package that builds with `tsc`. The other four audits encode codefast's own house
style (logical Tailwind directions, named React imports, a specific comment/divider grammar, a `namespace:Name` scheme
for `@codefast/di` tokens). Adopt them if they fit your project; otherwise skip them, or use an allowlist to narrow
their scope.

## `arrange`

Rewrites Tailwind class strings inside `cn()` and `tv()` calls, regrouping utilities in render-pipeline order —
existence, position, layout, sizing, spacing, shape, background, shadow, typography, composite, motion, starting,
behavior, state, selector — rather than alphabetically. (This is codefast's ordering, deliberately different from the
official Prettier Tailwind plugin's sort.)

```bash
codefast arrange inspect packages/ui/src          # read-only report
codefast arrange --dry-run packages/ui/src        # preview the rewrite
codefast arrange packages/ui/src                  # write
```

When `[target]` is omitted, `arrange` uses the nearest directory with a `package.json`, walking up from the current
directory. Directory scans skip test files (`*.test.*` / `*.spec.*`), because a `cn()` inside an assertion is
intentional; pass such a file explicitly to process it.

`arrange` rewrites a `cn()` / `tv()` call only when its binding is imported from a recognized module — `clsx`,
`class-variance-authority`, `tailwind-variants`, `@codefast/tailwind-variants`, a `@/lib/utils` / `~/lib/utils` /
`#lib/utils` re-export, any `…/utils` path, or a dedicated `cn.ts` module — so an unrelated local `cn` is left alone.
Long static JSX `className` strings are regrouped regardless of where `cn` comes from.

| Flag                 | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `--dry-run`          | Preview suggested replacements without writing files.                         |
| `--with-classname`   | Append `className` as the final `cn()` argument (alias: `--with-class-name`). |
| `--cn-import <spec>` | Override the module specifier used when a missing `cn` import is added.       |
| `--json`             | Print one JSON summary on stdout (suppresses human progress).                 |

Exits `1` when the `arrange.onAfterWrite` hook fails, `0` otherwise.

### `arrange inspect [target]`

Read-only report of long strings, nested `cn` inside `tv()`, and related findings. Accepts `--json`.

### `arrange simplify [target]`

Flattens grouped arrays and static-only `cn()` calls back to plain strings in `tv()` slots — the inverse cleanup pass.
In a mixed `cn()` call it coalesces only _adjacent_ static literals and keeps argument order, so tailwind-merge
precedence is unchanged (a later argument still overrides an earlier one).

| Flag                       | Description                                                                                              |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `--dry-run`                | Show what simplify would change without writing files.                                                   |
| `--fold-variant-classname` | Fold `cn()` overrides into a variant function's `className` option (alias: `--fold-variant-class-name`). |
| `--json`                   | Print one JSON summary on stdout.                                                                        |

With `--fold-variant-classname`, `cn(buttonVariants({ size: "sm" }), "flex-1")` becomes
`buttonVariants({ size: "sm", className: "flex-1" })`, and a dynamic or multi-part override folds into a `className`
array. The fold fires only when the native TypeScript type server confirms the callee's options accept a `className` (or
`class`) of the right shape, so it loads the `typescript` package (an optional peer, v7) and needs the target inside a
`tsconfig`; files outside a project keep the base pass. Run a formatter afterward — a folded call can exceed the print
width until it is wrapped.

### `arrange group <tokens...>`

Groups a pasted class string without touching the filesystem — the one command that needs no workspace, useful for
checking how classes would be bucketed:

```bash
codefast arrange group "relative flex h-10 w-full items-center rounded-md bg-primary"
codefast arrange group --tv "flex items-center gap-2"
```

| Flag               | Description                                                                   |
| ------------------ | ----------------------------------------------------------------------------- |
| `--tv`             | Emit a `tv()`-style array instead of a `cn()` call.                           |
| `--with-classname` | Append `className` as the final `cn()` argument (alias: `--with-class-name`). |
| `--json`           | Emit `{ schemaVersion, primaryLine, bucketsCommentLine }` on stdout.          |

## `mirror`

Scans each package's built `dist/` tree and writes its `package.json#exports` map, plus top-level `main`, `module`, and
`types` mirrored from the root export and a `files` entry for `dist`. In a workspace it processes every package under
`pnpm-workspace.yaml`; in a single-package project it processes that one package. **Build first** — `mirror` reads
`dist/`, and stale output produces stale exports.

```bash
codefast mirror                 # all workspace packages
codefast mirror packages/ui     # one package (path relative to repo root)
codefast mirror --dry-run       # report changes without writing
```

| Flag              | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `--dry-run`       | Report what would change without writing any `package.json`.  |
| `-v`, `--verbose` | Print extra diagnostics.                                      |
| `--json`          | Print one JSON summary on stdout (suppresses human progress). |

Exits `1` when any package fails, `0` otherwise.

### Per-package `mirror` configuration

The `mirror` config is a record keyed by package name, set under `mirror` in `codefast.config.*`. Set a package to
`false` to skip it entirely; omit a package to process it with defaults. For a package you do configure, these keys
apply (see the [Configuration](#configuration) example for their shape):

- **`source`** (`boolean | string`, default `true`) — emit a `source` condition pointing at the original `.ts` so a
  consumer using the `source` condition resolves your `src/`. A string overrides the root-export source path explicitly.
- **`types`** (`boolean`, default `true`) — emit the `types` condition when a matching `.d.ts` exists.
- **`import`** (`boolean`, default `true`) — emit the `import` condition.
- **`preserve`** (`boolean`) — keep the existing `package.json#exports` map as written and only fill in the missing
  `source` / `types` / `import` conditions; no `dist/` scan runs, so the public surface stays exactly what you declared.
- **`strip`** (`string`) — a `dist/` path prefix to flatten out of the generated specifiers, so `./components/button` is
  published as `./button` rather than leaking the internal folder.
- **`exclude`** (`string[]`) — specifiers to leave out of the generated map, making a package's public surface a
  decision rather than a consequence of its `dist/` layout. Matched against the specifier as it appears in `exports`
  (after `strip`); a trailing `/*` excludes a whole subtree. The root export and `./package.json` are never excluded.
- **`exports`** (`Record<string, string>`) — extra or overriding entries merged into the generated map, for specifiers
  the `dist/` scan does not produce (for example a raw CSS source path).
- **`css`** (`boolean | { enabled?, forceExportFiles?, customExports? }`) — how CSS files in `dist/` become exports:
  `true` enables the default wildcard handling, and the object form tunes it (`enabled` toggles it, `forceExportFiles`
  adds them to `files`, `customExports` sets explicit per-file CSS entries).

`source`, `types`, and `import` default to `true`, so an empty config object still emits all three.

## `pack-slim`

Slims a published package down to what a consumer's `tsc` and Node actually read, so the npm tarball ships `dist`
runtime and types only. Where `mirror` writes the full exports — including the `source` condition — for local
development, `pack-slim` removes that development lane for publish: it drops `src` from `files`, every `source`
condition from `exports`/`imports`, every `imports` entry left pointing outside `files`, every script that is not an
install or publish lifecycle hook, `devDependencies`, and the `dist` source maps plus their dangling `sourceMappingURL`
directives. Private packages are skipped. It is meant to run on an ephemeral CI checkout right before publish, so its
result is **never committed**.

Because that result must never be committed, `pack-slim` refuses to write when the git working tree has uncommitted
tracked changes — a guard against an accidental local run landing on real work. `--dry-run` is exempt (it writes
nothing) and `--force` overrides the guard. In CI the guard is invisible: `dist` is gitignored, so the tree is already
clean when the release workflow runs `pack-slim`.

```bash
codefast pack-slim                 # every published package
codefast pack-slim packages/ui     # one package (path relative to repo root)
codefast pack-slim --dry-run       # report what would be stripped without touching a file
```

| Flag        | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| `--dry-run` | Report what would be stripped without touching any file.          |
| `--force`   | Run even if the git working tree has uncommitted tracked changes. |
| `--json`    | Print one JSON summary on stdout (suppresses human progress).     |

Exits `1` when any package fails, `0` otherwise.

## `tag`

Adds `@since <version>` tags to the doc comments of exported declarations that lack one, creating the doc block when
there is none. The version comes from the nearest `package.json` above each target file, and declarations that already
carry `@since` are left alone. Run it at release time so published APIs carry accurate version metadata — never
hand-write `@since`.

```bash
codefast tag                   # auto-discover packages from cwd (or the single package)
codefast tag packages/ui/src   # tag one directory or file
codefast tag --dry-run         # summary only, no writes
```

| Flag        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `--dry-run` | Show summary without writing files.                           |
| `--json`    | Print one JSON summary on stdout (suppresses human progress). |

Exits `1` when no target is selected, when any target fails, or when the `tag.onAfterWrite` hook fails.

## `audit`

Every audit is read-only, exits non-zero when findings remain (so it gates a CI pipeline with no extra glue), and takes
an optional `[target]` plus `--json`. Each also reads an `allowlist` from configuration for intentional exceptions.

### `audit links`

_General-purpose._ Scans markdown for cross-references that point at nothing: a relative path that does not exist, an
in-document anchor with no matching heading or `<a id>`, and an anchor into another document that the target does not
offer. That last case is the reason this exists — a browser fails it silently by scrolling to the top. External URLs are
not checked, and links inside fenced code are treated as examples rather than references.

```bash
codefast audit links                       # whole repo
codefast audit links packages/di           # explicit target
codefast audit links --json                # machine-readable summary
```

Configure exceptions via `audit.links.allowlist` — each entry is a bare link target or `repo/relative/doc.md:target`.

### `audit rtl`

_House style._ Scans for physical-direction Tailwind classes (e.g. `ml-*`, `left-*`, `text-left`) that should use
logical equivalents (`ms-*`, `start-*`, `text-start`) or an `rtl:` companion (`translate-x`, `space-x`, resize cursors).

```bash
codefast audit rtl                         # uses audit.rtl.target from config
codefast audit rtl packages/ui/src         # explicit target
codefast audit rtl --json                  # machine-readable summary
```

With no `[target]`, the scan root is `audit.rtl.target` from the config; when neither is set the command fails.
Configure exceptions via `audit.rtl.allowlist` — each entry is a bare class token or `repo/relative/path.tsx:token`.

### `audit imports`

_House style._ Enforces the monorepo's import policy over `.ts`/`.tsx` files:

- **React** — members must be imported by name. Flags `import * as React` and default `React` imports (type-only
  included), plus an implicit `React.*` UMD-global type reference (`e: React.FormEvent` with no import) that `tsc`
  accepts silently through the `export as namespace React` declaration in `@types/react`.
- **Zod** (front-end packages only) — flags a named `import { z } from "zod"`, which pins Zod's full locale set into the
  bundle; `import * as z from "zod"` lets bundlers tree-shake it.

```bash
codefast audit imports                       # whole repo
codefast audit imports apps/web/src          # explicit target
codefast audit imports --json                # machine-readable summary
```

Configure exceptions via `audit.imports.allowlist` — each entry is the offending source text as written or
`repo/relative/path.tsx:<text>`.

### `audit comments`

_House style._ Checks doc-comment conventions. Section dividers not in the one allowed form are mechanical, so `--fix`
rewrites them in place. The rest is reported for a person to fix: TSDoc grammar errors, JSDoc `{type}` payloads,
comments pointing at repo documents, `@param` lists that name some parameters but not all, `@param` descriptions without
the `-` separator, `@since` tags out of position or naming a version the package has not reached, and comment links to
missing paths.

```bash
codefast audit comments                    # whole repo
codefast audit comments packages/di/src    # explicit target
codefast audit comments --fix              # rewrite fixable dividers in place
codefast audit comments --json             # machine-readable summary
```

| Flag     | Description                                          |
| -------- | ---------------------------------------------------- |
| `--fix`  | Rewrite every mechanically fixable divider in place. |
| `--json` | Print one JSON summary on stdout.                    |

Configure exceptions via `audit.comments.allowlist` — each entry is a divider line as written or
`repo/relative/path.ts:<divider>`.

### `audit display-names`

_House style._ Enforces the display-name convention for every string a `token()`, `tag()`, or module factory takes: a
name is spelled like the TS symbol it stands for, under its owner's namespace — `namespace:Name`. The namespace is a
kebab-case package, app, or feature slug (or a scoped package name); a token or module name is PascalCase, a tag key is
camelCase. It scans TypeScript and markdown alike, since a doc sample is what a reader copies, and skips `tests/`,
`benchmarks/`, `.changeset/`, and `CHANGELOG.md`.

```bash
codefast audit display-names                       # whole repo
codefast audit display-names packages/di/examples  # explicit target
codefast audit display-names --json                # machine-readable summary
```

Configure exceptions via `audit.displayNames.allowlist` — each entry is the call as written, through its closing quote
(or parenthesis when the name is the only argument), or `repo/relative/path.ts:<call>`.

## Configuration

**You do not need a config file.** Every command has sensible defaults and works with none. Add a `codefast.config.*`
file at your project root only to change a default — and add only the sections for the commands you actually use.

**Where it goes and how it loads.** The CLI walks up from the working directory and uses the first match, checking
`codefast.config.mjs`, `codefast.config.js`, `codefast.config.cjs`, then `codefast.config.json` in each directory. JS
configs are loaded via [jiti](https://github.com/unjs/jiti) — so **only run the CLI in repositories you trust**, and
note that only a JS config can define `onAfterWrite` hooks (JSON can't hold functions). The schema is **strict**: an
unknown key is an error, which catches typos immediately.

### Start small

The smallest valid config is empty. Grow it one section at a time — each top-level key configures one command:

```js
// codefast.config.js
export default {};
```

| Key       | Command   | What it configures                                                                             |
| --------- | --------- | ---------------------------------------------------------------------------------------------- |
| `mirror`  | `mirror`  | per-package `exports` generation — see [per-package config](#per-package-mirror-configuration) |
| `tag`     | `tag`     | package names to skip, and a hook to run after writing                                         |
| `arrange` | `arrange` | a hook to run after writing                                                                    |
| `audit`   | `audit *` | each audit's default scan target and its `allowlist` of accepted exceptions                    |

### Author it with types

Don't memorize the shape. Import `defineConfig` (or annotate with the `CodefastConfig` type) and your editor completes
every key, checks the values, and catches typos **before you run anything** — the types _are_ the reference for what's
valid, and the strict runtime schema is the backstop.

```ts
// codefast.config.ts
import { defineConfig } from "@codefast/cli";

export default defineConfig({
  mirror: { "@acme/ui": { strip: "./components/" } }, // autocomplete: strip, exclude, source, types, css, …
});
```

A plain `.js` config gets the same help through a JSDoc type — no build step, no `.ts`:

```js
// codefast.config.js
/** @type {import("@codefast/cli").CodefastConfig} */
export default {
  mirror: { "@acme/ui": { strip: "./components/" } },
};
```

### Common recipes

**Run a formatter after a command rewrites files.** `tag` and `arrange` take an `onAfterWrite` hook (sync or async). It
runs only when files were actually written — never on `--dry-run`:

```js
// codefast.config.js
import { execSync } from "node:child_process";

const format = ({ files }) => execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" });

export default {
  tag: { onAfterWrite: format },
  arrange: { onAfterWrite: format },
};
```

**Skip packages.** `tag.skipPackages` takes globs matched against package names; `mirror` skips any package set to
`false`:

```js
export default {
  tag: { skipPackages: ["@acme/internal", "@apps/*"] },
  mirror: { "@acme/internal": false },
};
```

**Accept a known audit finding.** Every audit takes an `allowlist`. An entry is the offending text exactly as it
appears, or `repo/relative/path:<text>` to scope it to a single file:

```js
export default {
  audit: {
    imports: { allowlist: [`packages/legacy/src/x.ts:import { z } from "zod";`] },
    rtl: { allowlist: ["packages/ui/src/variants/sheet.ts:data-open:slide-in-from-left-10"] },
  },
};
```

### Complete reference

Every section together — see [per-package `mirror` configuration](#per-package-mirror-configuration) for the `mirror`
keys:

```js
// codefast.config.js
import { execSync } from "node:child_process";

export default {
  // Keyed by package name; `false` skips the package, omitted packages use defaults.
  mirror: {
    "@acme/ui": {
      strip: "./components/", // flatten a dist/ prefix out of public specifiers
      exclude: ["./internal/*"], // specifiers to leave out of the generated map
      exports: { "./css/*": "./src/css/*" }, // extra or overriding entries
      source: true, // add a `source` condition (a string overrides the root path)
      types: true, // add `types` when a .d.ts exists
      import: true, // add the `import` condition
      css: true, // boolean or { enabled, forceExportFiles, customExports }
    },
    "@acme/tailwind-variants": { preserve: true }, // keep exports as-is, only fill missing conditions
    "@acme/internal": false,
  },
  tag: {
    skipPackages: ["@acme/internal", "@apps/*"], // glob patterns matched against package names
    onAfterWrite: ({ files }) => execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" }),
  },
  arrange: {
    onAfterWrite: ({ files }) => execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" }),
  },
  audit: {
    rtl: {
      target: "packages/ui/src", // default scan root when no CLI arg is passed
      allowlist: [
        // bare token, or `repo/relative/path.tsx:token`
        "packages/ui/src/variants/sheet.ts:data-open:slide-in-from-left-10",
      ],
    },
    links: { allowlist: [] }, // bare link target, or `repo/relative/doc.md:target`
    comments: { allowlist: [] }, // divider as written, or `repo/relative/path.ts:<divider>`
    imports: { allowlist: [] }, // offending import text as written, or `repo/relative/path.tsx:<text>`
    displayNames: { allowlist: [] }, // call as written, or `repo/relative/path.ts:<call>`
  },
};
```

`source`, `types`, and `import` default to `true`, so an empty `mirror` entry still emits all three. The `onAfterWrite`
hooks run only when files were actually written — never on `--dry-run`; a hook failure is reported on stderr and the
command exits `1`.

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | Success.                                                        |
| `1`  | General failure (missing paths, failed packages, failed hooks). |
| `2`  | Invalid arguments or configuration.                             |

## Programmatic use

`@codefast/cli` is importable as well as executable. `runCli` runs the same CLI in-process and resolves to the exit code
it would have exited with — the `codefast` binary is a thin wrapper around it.

```ts
import { runCli } from "@codefast/cli";

// `argv` follows the `process.argv` layout: the first two entries are ignored,
// exactly as when Node runs the binary.
const exitCode = await runCli(["node", "codefast", "mirror", "--dry-run", "--json"]);

if (exitCode !== 0) {
  throw new Error(`codefast exited with ${exitCode}`);
}
```

The command still writes its human or `--json` output to stdout/stderr; `runCli` does not capture it. Read stdout
yourself when you need the structured summary.

## How the codefast monorepo uses it

The tool is general; the codefast monorepo just wires convenience scripts and a release step around it — a good template
if you adopt the CLI in your own workspace. It runs from the built output via root `package.json` scripts:

```bash
pnpm run codefast <command>         # generic entry: node ./packages/cli/dist/bin.js

pnpm run cli:arrange                # codefast arrange
pnpm run cli:mirror                 # codefast mirror
pnpm run cli:audit:links            # codefast audit links
pnpm run cli:audit:rtl              # codefast audit rtl
pnpm run cli:audit:comments         # codefast audit comments
pnpm run cli:audit:imports          # codefast audit imports
pnpm run cli:audit:display-names    # codefast audit display-names
```

`pnpm run version-packages` runs `changeset version` and then `codefast tag`, so published APIs are stamped at release,
and the release workflow runs `codefast pack-slim` as its publish step on a clean CI checkout.

## Documentation

- [codefastlabs.com/docs/cli](https://codefastlabs.com/docs/cli) — this document, rendered.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the package is laid out: command wiring, the `Result` type, and the
  filesystem port.
- [`DECISIONS.md`](./DECISIONS.md) — the design decisions that shape the package and the reasons behind them.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for every published version.

## Contributing

The package is developed in the [codefast monorepo](https://github.com/codefastlabs/codefast); the repo-wide
[contributing guide](../../CONTRIBUTING.md) covers setup, the test taxonomy, and the release flow.

## License

Released under the [MIT License](./LICENSE).
