# @codefast/cli

Developer CLI for the [Codefast monorepo](https://github.com/codefastlabs/codefast) — `arrange` Tailwind class strings, `audit` source conventions (RTL), `mirror` export maps from `dist/`, and `tag` exported APIs with `@since`.

[![npm version](https://img.shields.io/npm/v/@codefast/cli)](https://www.npmjs.com/package/@codefast/cli)
[![license](https://img.shields.io/npm/l/@codefast/cli)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

This package exists to maintain the Codefast repository itself. It is published to npm and works in any pnpm workspace with a similar layout, but its flags and defaults follow Codefast's conventions — treat it as repo tooling, not a general-purpose product.

## Installation and usage

Inside the Codefast monorepo, the CLI runs from its built output via root `package.json` scripts:

```bash
pnpm --filter @codefast/cli build   # produce dist/bin.mjs first

pnpm run codefast <command>         # generic entry: node ./packages/cli/dist/bin.mjs

# Convenience wrappers
pnpm run cli:arrange                # codefast arrange
pnpm run cli:arrange:inspect        # codefast arrange inspect
pnpm run cli:arrange:preview        # codefast arrange --dry-run
pnpm run cli:arrange:simplify       # codefast arrange simplify
pnpm run cli:arrange:simplify:preview
pnpm run cli:mirror                 # codefast mirror
pnpm run cli:mirror:preview         # codefast mirror --dry-run
pnpm run cli:audit:rtl              # codefast audit rtl
```

Standalone install (Node >= 24):

```bash
pnpm add -g @codefast/cli
# or one-off
pnpm dlx @codefast/cli --help
```

Every command writes by default; pass `--dry-run` to preview. The global `--no-color` flag must come before the command name (`codefast --no-color mirror`). Commands that accept `--json` print a single JSON object on stdout and suppress human progress output.

## `arrange`

Rewrites Tailwind class strings inside `cn()` and `tv()` calls, regrouping utilities in render-pipeline order (existence, position, layout, sizing, spacing, shape, background, shadow, typography, composite, motion, behavior, state, selector) instead of alphabetically.

```bash
codefast arrange inspect packages/ui/src          # read-only report
codefast arrange --dry-run packages/ui/src        # preview the rewrite
codefast arrange packages/ui/src                  # write
```

When `[target]` is omitted, `arrange` uses the nearest package directory found by walking up from the current working directory. Directory scans skip test files (`*.test.*` / `*.spec.*`); pass such a file explicitly to process it.

| Flag                 | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `--dry-run`          | Preview suggested replacements without writing files.                         |
| `--with-classname`   | Append `className` as the final `cn()` argument (alias: `--with-class-name`). |
| `--cn-import <spec>` | Override the module specifier used when a missing `cn` import is added.       |
| `--json`             | Print one JSON object on stdout (suppresses human progress).                  |

### `arrange inspect [target]`

Read-only report of long strings, nested `cn` inside `tv()`, and related findings. Accepts `--json`.

### `arrange simplify [target]`

Flattens grouped arrays and static-only `cn()` calls back to plain strings in `tv()` slots — the inverse cleanup pass. Accepts `--dry-run` and `--json`.

### `arrange group <tokens...>`

Groups a pasted class string without touching the filesystem — useful for checking how classes would be bucketed:

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

Scans each workspace package's built `dist/` tree and writes its `package.json#exports` map (plus top-level `main`, `module`, `types`, and a `files` entry for `dist`). The workspace root is discovered via `pnpm-workspace.yaml`, so it runs from anywhere inside the repo. Build first — `mirror` reads `dist/`, and stale output produces stale exports.

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

## `audit rtl`

Read-only scan for physical-direction Tailwind classes (e.g. `ml-*`, `left-*`, `text-left`) that should use logical equivalents (`ms-*`, `start-*`, `text-start`) or an `rtl:` companion (`translate-x`, `space-x`, resize cursors). Exits non-zero when violations remain so it can gate CI.

```bash
codefast audit rtl                         # uses audit.rtl.target from config
codefast audit rtl packages/ui/src         # explicit target
codefast audit rtl --json                  # machine-readable summary
```

| Flag     | Description                       |
| -------- | --------------------------------- |
| `--json` | Print one JSON summary on stdout. |

Configure intentional exceptions via `audit.rtl.allowlist` in `codefast.config` — each entry is a bare class token or `repo/relative/path.tsx:token`.

## `tag`

Adds `@since <version>` tags to doc comments of exported declarations that lack one, creating the doc block when missing. The version comes from the nearest `package.json` walking up from each target file. Declarations that already carry `@since` are left alone.

```bash
codefast tag                   # auto-discover workspace packages from cwd
codefast tag packages/ui/src   # tag one directory or file
codefast tag --dry-run         # summary only, no writes
```

| Flag        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `--dry-run` | Show summary without writing files.                           |
| `--json`    | Print one JSON summary on stdout (suppresses human progress). |

In this repo, `tag` runs as part of the release workflow so published APIs carry accurate version metadata — never hand-write `@since` tags.

## Configuration

An optional `codefast.config.*` file adjusts `mirror`, `tag`, `arrange`, and `audit`. The CLI walks up from the working directory and uses the first match, checking `codefast.config.mjs`, `codefast.config.js`, `codefast.config.cjs`, then `codefast.config.json` in each directory. JS configs are loaded via [jiti](https://github.com/unjs/jiti), so only run the CLI in repositories you trust; JSON configs cannot define hooks.

```js
// codefast.config.js
import { execSync } from "node:child_process";

export default {
  // Keyed by package name; `false` skips the package, omitted packages use defaults.
  mirror: {
    "@acme/ui": {
      strip: "./components/", // flatten a dist/ prefix out of public specifiers
      exports: { "./css/*": "./src/css/*" }, // extra or overriding entries
      source: true, // add a `source` condition (string overrides the root path)
      types: true, // add `types` when a .d.ts exists
      import: true, // add the `import` condition
      css: true, // boolean or { enabled, forceExportFiles, customExports }
    },
    "@acme/tailwind-variants": { preserve: true }, // keep exports as-is, only fill missing conditions
    "@acme/internal": false,
  },
  tag: {
    skipPackages: ["@acme/internal"],
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
  },
};
```

The `onAfterWrite` hooks (sync or async) run only when files were actually written — never on `--dry-run`. A hook failure is reported on stderr and the command exits `1`.

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | Success.                                                        |
| `1`  | General failure (missing paths, failed packages, failed hooks). |
| `2`  | Invalid invocation or input.                                    |

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)
