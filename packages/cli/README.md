# @codefast/cli

A small developer CLI for maintenance tasks in a TypeScript monorepo — Tailwind class arranging, `package.json` `exports` mirroring, and `@since` JSDoc tagging.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/cli.svg)](https://www.npmjs.com/package/@codefast/cli)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/cli.svg)](https://www.npmjs.com/package/@codefast/cli)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Why @codefast/cli](#why-codefastcli)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Global options](#global-options)
- [Exit codes](#exit-codes)
- [`arrange`](#arrange)
- [`mirror sync`](#mirror-sync)
- [`tag` / `annotate`](#tag--annotate)
- [Configuration (`codefast.config.*`)](#configuration-codefastconfig)
- [Lifecycle hooks](#lifecycle-hooks)
- [Grouping philosophy — Render Pipeline Order](#grouping-philosophy--render-pipeline-order)
- [Troubleshooting](#troubleshooting)
- [Contributing (monorepo setup)](#contributing-monorepo-setup)
- [License](#license)
- [Changelog](#changelog)

---

## Why @codefast/cli

Three recurring maintenance chores you don't want to script by hand:

- **`arrange`** — regroup Tailwind class strings inside `cn()` / `tv()` calls in render-pipeline order.
- **`mirror`** — regenerate `package.json` `exports` fields from built `dist/` trees across a pnpm workspace.
- **`tag`** (alias **`annotate`**) — add `@since <version>` JSDoc tags to exported declarations that are missing version metadata.

```mermaid
flowchart LR
  R[codefast]
  R --> A[arrange]
  R --> M[mirror]
  R --> T[tag]

  A --> A0[analyze]
  A --> A1[preview]
  A --> A2[apply]
  A --> A3[group]

  M --> M0[sync]
```

---

## Requirements

- Node.js `>= 22.0.0`
- pnpm (recommended — the CLI discovers workspaces via `pnpm-workspace.yaml`)

---

## Installation

```bash
# Install globally
pnpm add -g @codefast/cli
# or
npm install -g @codefast/cli
# or
yarn global add @codefast/cli

# Or run without installing
pnpm dlx @codefast/cli --help
# or
npx @codefast/cli --help
```

---

## Quick Start

```bash
# Analyze Tailwind classes in the nearest package
codefast arrange analyze

# Preview proposed rewrites — no files written
codefast arrange preview packages/ui/src/components

# Apply after reviewing
codefast arrange apply packages/ui/src/components

# Regenerate every package's `exports` from built dist/
codefast mirror sync

# Add @since <version> to exported APIs under ./src
codefast tag
```

---

## Global options

| Flag              | Effect                                                                 |
| ----------------- | ---------------------------------------------------------------------- |
| `--no-color`      | Disable ANSI color output (also respected by JSON output suppression). |
| `-V`, `--version` | Print the CLI version and exit.                                        |
| `-h`, `--help`    | Show contextual help for the invoked command.                          |

---

## Exit codes

| Code | Meaning                                                                                                  |
| ---- | -------------------------------------------------------------------------------------------------------- |
| `0`  | Success.                                                                                                 |
| `1`  | General failure (missing paths, infrastructure errors, partial failures in `mirror sync`, failed hooks). |
| `2`  | Invalid invocation or input (Zod schema validation on CLI requests — `CLI_EXIT_USAGE`).                  |

Diagnostics go to **stderr**; primary command output goes to **stdout**. When a subcommand accepts `--json`, only the JSON object is written to stdout and all human progress is suppressed, so the stream stays pipeline-safe.

---

## `arrange`

Reads `cn()` and `tv()` call sites, classifies each Tailwind utility, and rewrites the class string in render-pipeline order (see [Grouping philosophy](#grouping-philosophy--render-pipeline-order)).

### Target resolution

When `[target]` is omitted, `arrange` auto-detects the **nearest package directory** by walking up from the current working directory until it finds a `package.json`. Pass an explicit path (file or directory) to override.

### Workflow

| Step | Command                             | Effect                                |
| ---- | ----------------------------------- | ------------------------------------- |
| 1    | `codefast arrange analyze [target]` | Report only — no files changed        |
| 2    | `codefast arrange preview [target]` | Show exactly what `apply` would write |
| 3    | `codefast arrange apply [target]`   | Write the changes                     |

### Flags (preview / apply)

| Flag                 | Description                                                                 |
| -------------------- | --------------------------------------------------------------------------- |
| `--with-class-name`  | Append `className` as the last argument when rewriting a `cn(...)` call.    |
| `--cn-import <spec>` | Override the module specifier used when a missing `cn` import is added.     |
| `--json`             | Print a single JSON object on stdout; suppresses human progress and colors. |

`analyze` also supports `--json`.

### `arrange group` — one-shot classification

Groups a class string without touching the filesystem. Useful for checking how classes would be grouped before running `apply`:

```bash
# Quoted string
codefast arrange group "relative flex items-center h-10 w-full rounded-md bg-primary text-white hover:bg-primary/90"

# Or space-separated tokens (no quotes needed)
codefast arrange group relative flex items-center h-10 w-full rounded-md

# Emit a tv()-style array instead of a cn() call
codefast arrange group --tv "flex items-center gap-2"
```

| Flag                | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `--tv`              | Emit a `tv()`-style array literal instead of a `cn(...)` call.       |
| `--with-class-name` | Append `className` to the emitted `cn(...)` call.                    |
| `--json`            | Emit `{ schemaVersion, primaryLine, bucketsCommentLine }` on stdout. |

### `--json` payloads

| Subcommand          | Payload highlights                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `analyze`           | `schemaVersion`, `analyzeRootPath`, full `report` (same data as the human report).                                                         |
| `preview` / `apply` | `schemaVersion`, `write`, `ok` (`false` if the `onAfterWrite` hook failed), full `result` (`filePaths`, `modifiedFiles`, `totalFound`, …). |
| `group`             | `schemaVersion`, `primaryLine`, `bucketsCommentLine`.                                                                                      |

---

## `mirror sync`

Scans built `dist/` trees and regenerates the `exports` field of every workspace package. Run it from anywhere inside the monorepo — the workspace root is discovered via `pnpm-workspace.yaml`.

```bash
codefast mirror sync                 # all workspace packages
codefast mirror sync packages/ui     # one package (path relative to repo root)
codefast mirror sync -v              # verbose diagnostics
codefast mirror sync --json          # JSON summary for scripts / CI
```

| Flag              | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `-v`, `--verbose` | Print extra diagnostics.                                              |
| `--json`          | Print a single `{ schemaVersion, ok, elapsedSeconds, stats }` object. |

> **Build first.** `mirror sync` reads from `dist/`. Run your build before syncing or exports will reflect stale output.

Exit code is `1` when any package fails (`stats.packagesErrored > 0`), `0` otherwise.

---

## `tag` / `annotate`

Scans `.ts` / `.tsx` sources and adds `@since <current-package-version>` to exported declarations that don't already carry one. The version is read from the nearest `package.json` walking up from the target path.

```bash
codefast tag                   # auto-discover workspace packages from cwd
codefast tag packages/ui/src   # annotate a custom target
codefast annotate --dry-run    # preview only, do not write
codefast tag --json            # JSON summary for scripts / CI
```

| Flag        | Description                                                       |
| ----------- | ----------------------------------------------------------------- |
| `--dry-run` | Show summary without writing files.                               |
| `--json`    | Print a single JSON summary on stdout; suppresses human progress. |

What it updates:

- Adds `/** @since <version> */` when an exported declaration has no JSDoc.
- Injects `@since <version>` into an existing JSDoc block that lacks one.
- Leaves declarations alone when `@since` is already present.

---

## Configuration (`codefast.config.*`)

Create `codefast.config.js`, `.mjs`, `.cjs`, or `.json` at the repo root. Each command reads its own slice.

```javascript
// codefast.config.mjs
import { execSync } from "node:child_process";

export default {
  mirror: {
    skipPackages: ["@acme/internal"],
    pathTransformations: {
      "@acme/ui": { removePrefix: "./components/" },
    },
    customExports: {
      "@acme/ui": {
        "./css/*": "./src/styles/*",
      },
    },
    cssExports: {
      // Shorthand: `true` enables default CSS export detection
      "@acme/theme": true,
      // Or configure explicitly:
      "@acme/ui": {
        enabled: true,
        forceExportFiles: false,
        customExports: {
          "./tokens.css": "./dist/tokens.css",
        },
      },
    },
  },

  tag: {
    skipPackages: ["@acme/internal"],
    onAfterWrite: ({ files }) => {
      execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" });
    },
  },

  arrange: {
    onAfterWrite: ({ files }) => {
      execSync(`oxfmt ${files.join(" ")}`, { stdio: "inherit" });
    },
  },
};
```

Notes:

- Keys in `mirror.skipPackages` / `pathTransformations` / `customExports` / `cssExports` are **package names** from `package.json#name` (e.g. `@acme/ui`). Path-based keys such as `packages/ui` are deprecated and will be removed.
- `cssExports[pkg]` accepts a boolean shorthand or the full `{ enabled, customExports, forceExportFiles }` object.
- `tag.skipPackages` lists package names to skip entirely when `codefast tag` is run without an explicit target.

> **Security.** `.js`, `.mjs`, and `.cjs` config files are loaded via `import()` — only run `codefast` inside repositories you trust.

---

## Lifecycle hooks

Both `tag` and `arrange apply` expose an `onAfterWrite` hook so teams can plug in their own formatter, lint-fix step, or codemod without embedding one in the CLI core.

```javascript
export default {
  tag: {
    onAfterWrite: async ({ files }) => {
      console.log(`Formatting ${files.length} files…`);
      // sync or async work
    },
  },
  arrange: {
    onAfterWrite: ({ files }) => {
      /* … */
    },
  },
};
```

Contract:

- `tag.onAfterWrite?.({ files })` runs after `codefast tag` writes files.
- `arrange.onAfterWrite?.({ files })` runs after `codefast arrange apply` writes files.
- Hooks may be synchronous or asynchronous (`void | Promise<void>`).
- Hook failures are reported on stderr; both commands exit with code `1` when the hook rejects.

---

## Grouping philosophy — Render Pipeline Order

`arrange` does **not** sort classes alphabetically. Instead, it groups utilities in roughly the order the browser applies them — from the box's existence, through its shape and surface, to interactive behavior. This makes class strings easier to scan and diff.

**Existence → Position → Layout → Sizing → Spacing → Shape → Background → Shadow → Typography → Composite → Motion → Starting → Behavior → State → Selector**

| Bucket         | What it covers                                      | Examples                                          |
| -------------- | --------------------------------------------------- | ------------------------------------------------- |
| **Existence**  | Display and containment context                     | `hidden`, `block`, `@container`, `group`, `peer`  |
| **Position**   | Where the box sits                                  | `absolute`, `inset-*`, `top-*`, `z-*`             |
| **Layout**     | How children flow                                   | `flex`, `grid`, `gap-*`, `items-*`                |
| **Sizing**     | Box dimensions and overflow                         | `w-*`, `h-*`, `aspect-*`, `overflow-*`            |
| **Spacing**    | Padding and margin only (gaps stay with Layout)     | `p-*`, `m-*`                                      |
| **Shape**      | Corners and strokes                                 | `rounded-*`, `border-*`, `ring-*`                 |
| **Background** | Surfaces and masks                                  | `bg-*`, `from-*`, `via-*`, `to-*`, `mask-*`       |
| **Shadow**     | Depth                                               | `shadow-*`, `inset-shadow-*`, `text-shadow-*`     |
| **Typography** | Text appearance                                     | `font-*`, `text-*`, `leading-*`                   |
| **Composite**  | Layers and transforms (3D context → 3D → 2D)        | `opacity-*`, `rotate-x-*`, `translate-*`          |
| **Motion**     | Time-based change                                   | `transition-*`, `animate-*`                       |
| **Starting**   | Tailwind's `starting:` layer — kept next to Motion  | `starting:*`                                      |
| **Behavior**   | Input, scrolling, and browser chrome                | `cursor-*`, `scroll-*`, `field-sizing-*`, `inert` |
| **State**      | Interactive and conditional variants (non-selector) | `hover:`, `md:`, `@md/sidebar:`, `data-[…]:`      |
| **Selector**   | Selector-driven variants                            | `[&…]:`, `*:`, `**:`, `has-*`, `group-[…]:`       |

Adjacent buckets may be merged into a single string literal when declared _compatible_ (e.g. Layout + Sizing), which keeps `cn()` calls readable without flattening unrelated concerns.

To change placement, extend `classifyBareUtility` in `src/domains/arrange/domain/tailwind-token-classifier.domain-service.ts` (and cover the new rule with arrange tests if you introduce a new bucket).

---

## Troubleshooting

**`codefast: command not found`**
Install globally with `pnpm add -g @codefast/cli`, or run via `pnpm dlx @codefast/cli <command>`.

**`mirror sync` writes little or no output**
Packages must be built first. Ensure `dist/` exists by running your build step, then re-run `codefast mirror sync`.

**Unexpected class reorder after `arrange apply`**
Run `arrange preview` first and smoke-test the UI. Some components rely on cascade-sensitive ordering that `arrange` cannot detect automatically.

**`--json` output mixed with progress lines**
Some shells buffer progress writes on stderr into stdout when piping — redirect stderr explicitly: `codefast mirror sync --json 2>/dev/null | jq`.

---

## Contributing (monorepo setup)

```bash
# Build the local CLI (produces dist/bin.mjs)
pnpm --filter @codefast/cli build

# Run the local entrypoint
pnpm exec codefast --help

# Test + type-check
pnpm --filter @codefast/cli test
pnpm --filter @codefast/cli check-types
```

A few naming conventions:

- **`codefast <command>`** refers to CLI commands exposed via the `bin` entry in `@codefast/cli`.
- **Scripts in `packages/cli/package.json`** (`build`, `test`, …) are package-local dev scripts, not CLI commands.
- The root `package.json` includes optional convenience wrappers (e.g. `cli:mirror-sync`, `cli:arrange-analyze`) for common dev workflows.

---

## License

[MIT](https://opensource.org/licenses/MIT) — see [`package.json`](./package.json).

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history. Releases are also published on [npm](https://www.npmjs.com/package/@codefast/cli?activeTab=versions).
