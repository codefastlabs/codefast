# @codefast/cli

`codefast` bundles two tools:

| Command           | Purpose                                                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`mirror sync`** | Regenerate **`package.json` `exports`** from each package’s built **`dist/`** tree (pnpm workspace packages).                                                                                                |
| **`arrange`**     | **Analyze**, **dry-run**, or **apply** suggested grouping for long Tailwind class strings inside **`cn()`** / **`tv()`** call sites (Tailwind v4–oriented heuristics), or **`group`** a pasted class string. |

Use **`--help`** on any level (`codefast`, `codefast mirror`, `codefast arrange`, `codefast arrange preview`, …) whenever you are unsure about flags or arguments.

## Requirements

- **Node.js ≥ 24** (see `engines` in this package’s `package.json`).

## Install

**Global** (binary `codefast` on your `PATH`):

```bash
npm install -g @codefast/cli
# or
pnpm add -g @codefast/cli
```

**Without a global install**:

```bash
pnpm dlx @codefast/cli -- --help
npx @codefast/cli -- --help
```

Pass CLI flags **after** `--` when the runner needs it (as with `pnpm dlx` / `npx`).

## Use the CLI effectively

1. **Discover options from the tool** — `codefast --help`, then `codefast mirror --help` / `codefast arrange --help`, then `codefast arrange <subcommand> --help`. That stays accurate across versions.
2. **Stable logs / CI** — pass **`--no-color`** on the top-level program to disable ANSI color.
3. **Know what each command expects** — **`mirror sync`** needs a repo layout that contains **`pnpm-workspace.yaml`** (the CLI walks up from the install / current working directory to find the monorepo root). **`arrange`** accepts any file or directory you pass; if you omit the path, it uses a **default relative to your current working directory** (see below).

### `arrange` — recommended workflow

Heuristics rewrite literals inside **`cn(...)`** and in **`tv()`** slots (`class`, `className`, `compoundVariants`, nested `cn`, …). They are suggestions: always review diffs.

1. **`analyze [target]`** — Prints a report (long strings, nested `cn` in `tv`, and related notes). Use it to see **where** the tool sees work worth doing and **what** it will call out before you change files.
2. **`preview [target]`** — Same transforms as **`apply`**, but **writes nothing**. Use it to inspect stdout and confirm the output matches your style before touching the tree.
3. **`apply [target]`** — Writes edits. Prefer running **`preview`** on the same path and options first.

**Target path** — Optional. If omitted, the default is **`packages/ui/src/components`** resolved from **`process.cwd()`**. Pass an explicit path when your components live elsewhere (e.g. `codefast arrange analyze apps/web/src/components`).

**Useful options** (see `--help` for the full list):

- **`--with-class-name`** (alias **`--with-classname`**) — Append **`className`** as the **last** argument to the suggested **`cn(...)`** (preview / apply / `group`).
- **`--cn-import <spec>`** — Override the module specifier when the tool adds a **`cn`** import (preview / apply).

**`group [tokens...]`** — No filesystem: paste a class string (quote it if it contains spaces). Stdout shows a suggested **`cn(...)`** or, with **`--tv`**, a **`tv()`**-style array, plus a short **buckets** summary. Use this to **tune your mental model** of how grouping works before running **`analyze`** on a large tree.

### `mirror sync` — when and how

Run from anywhere under the monorepo; the CLI finds the root via **`pnpm-workspace.yaml`**.

- **`codefast mirror sync`** — All packages under **`packages/`** that participate in the generator.
- **`codefast mirror sync packages/ui`** — Only that package (path **relative to repo root**).
- **`codefast mirror sync -v`** / **`--verbose`** — Extra diagnostics.

**Config** — Prefer repo-root **`codefast.config.js`** (or `.mjs` / `.cjs` / `.json`) with a **`mirror`** object (`skipPackages`, `pathTransformations`, `customExports`, …). Legacy **`generate-exports.config.js`** / **`.json`** is still read if the Codefast config files are absent.

After changing build output layout, run **`mirror sync`** so **`package.json` `exports`** stay aligned with **`dist/`**.

## Developing inside this monorepo

From the repository root (after `pnpm install` and a build of this package): **`pnpm exec codefast --help`**. Root **`package.json`** defines optional **`cli:*`** scripts (for example **`cli:mirror-sync`**, **`cli:arrange-analyze`**) as thin wrappers around **`pnpm exec codefast …`**.

## License

MIT — see [LICENSE](./LICENSE).
