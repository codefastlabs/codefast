# @codefast/cli

The `codefast` command line for the [codefast monorepo](https://github.com/codefastlabs/codefast): `arrange` Tailwind
class strings, `audit` source conventions, `mirror` export maps from `dist/`, and `tag` exported APIs with `@since`.

[![npm version](https://img.shields.io/npm/v/@codefast/cli)](https://www.npmjs.com/package/@codefast/cli)
[![license](https://img.shields.io/npm/l/@codefast/cli)](./LICENSE)

This package is repo tooling published to npm: it runs in any pnpm workspace with a similar layout, but its flags and
defaults follow the codefast conventions rather than aiming to be a general-purpose product.

- **Safe by default** — every writing command has `--dry-run`; every audit is read-only except `audit comments --fix`.
- **Scriptable** — `--json` prints one JSON object on stdout and suppresses human progress output.
- **CI-ready** — audits exit non-zero when findings remain, so they gate a pipeline without extra glue.
- **Configurable** — an optional `codefast.config.*` file, validated by a strict schema, adjusts every command.

## Installation and usage

Inside the codefast monorepo, the CLI runs from its built output via root `package.json` scripts:

```bash
pnpm --filter @codefast/cli build   # produce dist/bin.js first

pnpm run codefast <command>         # generic entry: node ./packages/cli/dist/bin.js

# Convenience wrappers
pnpm run cli:arrange                # codefast arrange
pnpm run cli:arrange:inspect        # codefast arrange inspect
pnpm run cli:arrange:preview        # codefast arrange --dry-run
pnpm run cli:arrange:simplify       # codefast arrange simplify
pnpm run cli:arrange:simplify:preview
pnpm run cli:mirror                 # codefast mirror
pnpm run cli:mirror:preview         # codefast mirror --dry-run
pnpm run cli:audit:rtl              # codefast audit rtl
pnpm run cli:audit:links            # codefast audit links
pnpm run cli:audit:comments         # codefast audit comments
pnpm run cli:audit:react            # codefast audit react
```

`pnpm run version-packages` runs `changeset version` and then `codefast tag`, so published APIs are stamped at release.

Standalone install (Node >= 24):

```bash
pnpm add -g @codefast/cli
# or one-off
pnpm dlx @codefast/cli --help
```

Published on 0.x and versioned on its own track: breaking changes ship as minor versions, so pin the minor if you need
stability.

Every writing command writes by default; pass `--dry-run` to preview. The global `--no-color` flag must come before the
command name (`codefast --no-color mirror`). Commands that accept `--json` print a single JSON object on stdout and
suppress human progress output.

## `arrange`

Rewrites Tailwind class strings inside `cn()` and `tv()` calls, regrouping utilities in render-pipeline order —
existence, position, layout, sizing, spacing, shape, background, shadow, typography, composite, motion, starting,
behavior, state, selector — instead of alphabetically.

```bash
codefast arrange inspect packages/ui/src          # read-only report
codefast arrange --dry-run packages/ui/src        # preview the rewrite
codefast arrange packages/ui/src                  # write
```

When `[target]` is omitted, `arrange` uses the nearest directory with a `package.json` found by walking up from the
current working directory. Directory scans skip test files (`*.test.*` / `*.spec.*`), because a `cn()` inside an
assertion is intentional; pass such a file explicitly to process it.

| Flag                 | Description                                                                   |
| -------------------- | ----------------------------------------------------------------------------- |
| `--dry-run`          | Preview suggested replacements without writing files.                         |
| `--with-classname`   | Append `className` as the final `cn()` argument (alias: `--with-class-name`). |
| `--cn-import <spec>` | Override the module specifier used when a missing `cn` import is added.       |
| `--json`             | Print one JSON object on stdout (suppresses human progress).                  |

Exits `1` when the `arrange.onAfterWrite` hook fails, `0` otherwise.

### `arrange inspect [target]`

Read-only report of long strings, nested `cn` inside `tv()`, and related findings. Accepts `--json`.

### `arrange simplify [target]`

Flattens grouped arrays and static-only `cn()` calls back to plain strings in `tv()` slots — the inverse cleanup pass.
Accepts `--dry-run` and `--json`.

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

Scans each workspace package's built `dist/` tree and writes its `package.json#exports` map, plus top-level `main`,
`module`, and `types` mirrored from the root export and a `files` entry for `dist`. The workspace root is the directory
holding `pnpm-workspace.yaml`, so it runs from anywhere inside the repo. Build first — `mirror` reads `dist/`, and stale
output produces stale exports.

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

Read-only scan for physical-direction Tailwind classes (e.g. `ml-*`, `left-*`, `text-left`) that should use logical
equivalents (`ms-*`, `start-*`, `text-start`) or an `rtl:` companion (`translate-x`, `space-x`, resize cursors). Exits
non-zero when violations remain so it can gate CI.

```bash
codefast audit rtl                         # uses audit.rtl.target from config
codefast audit rtl packages/ui/src         # explicit target
codefast audit rtl --json                  # machine-readable summary
```

| Flag     | Description                       |
| -------- | --------------------------------- |
| `--json` | Print one JSON summary on stdout. |

With no `[target]`, the scan root is `audit.rtl.target` from the config; when neither is set the command fails.
Configure intentional exceptions via `audit.rtl.allowlist` — each entry is a bare class token or
`repo/relative/path.tsx:token`.

## `audit links`

Read-only scan for markdown cross-references that point at nothing: a relative path that does not exist, an in-document
anchor with no matching heading or `<a id>`, and an anchor into another document that the target does not offer. That
last one is the reason this exists — a browser fails it silently by scrolling to the top. External URLs are not checked,
and links inside fenced code are treated as examples rather than references. Exits non-zero when breakages remain so it
can gate CI.

```bash
codefast audit links                       # whole repo
codefast audit links packages/di           # explicit target
codefast audit links --json                # machine-readable summary
```

| Flag     | Description                       |
| -------- | --------------------------------- |
| `--json` | Print one JSON summary on stdout. |

Configure intentional exceptions via `audit.links.allowlist` — each entry is a bare link target or
`repo/relative/doc.md:target`.

## `audit comments`

Scans source comments for the repo's comment conventions. Section dividers that are not in the one allowed form are
mechanical, so `--fix` rewrites them in place. The rest is reported for a person to fix: TSDoc grammar errors, JSDoc
`{type}` payloads, comments pointing at repo documents, `@param` lists that name some parameters but not all, `@param`
descriptions without the `-` separator, `@since` tags out of position or naming a version the package has not reached,
and comment links to missing paths. Exits non-zero when unfixed findings remain so it can gate CI.

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

Configure intentional exceptions via `audit.comments.allowlist` — each entry is a divider line as written or
`repo/relative/path.ts:<divider>`.

## `audit react`

Read-only scan enforcing the repo's React import policy: members are imported by name. Flags `import * as React` and
default `React` imports (type-only included), plus an implicit `React.*` UMD-global type reference (`e: React.FormEvent`
with no import), which `tsc` accepts silently through the `export as namespace React` declaration in `@types/react`.
Exits non-zero when violations remain so it can gate CI.

```bash
codefast audit react                       # whole repo
codefast audit react apps/ui/src           # explicit target
codefast audit react --json                # machine-readable summary
```

| Flag     | Description                       |
| -------- | --------------------------------- |
| `--json` | Print one JSON summary on stdout. |

Configure intentional exceptions via `audit.react.allowlist` — each entry is the offending source text as written or
`repo/relative/path.tsx:<text>`.

## `tag`

Adds `@since <version>` tags to the doc comments of exported declarations that lack one, creating the doc block when
there is none. The version comes from the nearest `package.json` above each target file. Declarations that already carry
`@since` are left alone.

```bash
codefast tag                   # auto-discover workspace packages from cwd
codefast tag packages/ui/src   # tag one directory or file
codefast tag --dry-run         # summary only, no writes
```

| Flag        | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `--dry-run` | Show summary without writing files.                           |
| `--json`    | Print one JSON summary on stdout (suppresses human progress). |

Exits `1` when no target is selected, when any target fails, or when the `tag.onAfterWrite` hook fails. In this repo,
`tag` runs inside `pnpm run version-packages` so published APIs carry accurate version metadata — never hand-write
`@since` tags.

## Configuration

An optional `codefast.config.*` file adjusts `mirror`, `tag`, `arrange`, and `audit`. The CLI walks up from the working
directory and uses the first match, checking `codefast.config.mjs`, `codefast.config.js`, `codefast.config.cjs`, then
`codefast.config.json` in each directory. JS configs are loaded via [jiti](https://github.com/unjs/jiti), so only run
the CLI in repositories you trust; JSON configs cannot define hooks. The schema is strict: an unknown key is a
configuration error.

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
    react: { allowlist: [] }, // offending text as written, or `repo/relative/path.tsx:<text>`
  },
};
```

`source`, `types`, and `import` default to `true`. The `onAfterWrite` hooks (sync or async) run only when files were
actually written — never on `--dry-run`. A hook failure is reported on stderr and the command exits `1`.

## Exit codes

| Code | Meaning                                                         |
| ---- | --------------------------------------------------------------- |
| `0`  | Success.                                                        |
| `1`  | General failure (missing paths, failed packages, failed hooks). |
| `2`  | Invalid arguments or configuration.                             |

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
