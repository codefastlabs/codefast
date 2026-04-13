# @codefast/cli

Two tools bundled in one CLI:

| Command       | Purpose                                                                                                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mirror sync` | Regenerate `package.json` `exports` from each package's built `dist/` tree (pnpm workspace packages)                                                                                |
| `arrange`     | Analyze, dry-run, or apply suggested grouping for long Tailwind class strings inside `cn()` / `tv()` call sites (Tailwind v4–oriented heuristics), or `group` a pasted class string |

---

## Requirements & Install

**Node.js ≥ 24** is required.

```bash
# Global
pnpm add -g @codefast/cli

# Without a global install
pnpm dlx @codefast/cli -- --help
```

---

## `arrange`

### Recommended workflow

1. **`analyze [target]`** — Prints a report (long strings, nested `cn` in `tv`, related notes). No files changed.
2. **`preview [target]`** — Same transforms as `apply`, but writes nothing. Inspect stdout before touching the tree.
3. **`apply [target]`** — Writes edits. Run `preview` first.

**Default target** (when path is omitted): `packages/ui/src/components` resolved from `process.cwd()`.

### Useful options

- **`--with-class-name`** — Append `className` as the last argument to the suggested `cn(...)`.
- **`--cn-import <spec>`** — Override the module specifier when the tool adds a `cn` import.

### `group [tokens...]`

No filesystem involved — paste a class string, get back a suggested `cn(...)` (or a `tv()`-style array with `--tv`) plus a short buckets summary. Use this to tune your mental model before running `analyze` on a large tree.

---

## Grouping philosophy — Render Pipeline Order

`arrange` does **not** sort alphabetically. It groups utilities in roughly the same order the browser reasons about them:

**Existence → Position → Layout → Sizing → Spacing → Shape → Background → Shadow → Typography → Composite → Motion → Starting → Behavior → Conditions (State) → Selectors**

Bucket breakdown:

| Bucket         | What it covers                                    | Examples                                          |
| -------------- | ------------------------------------------------- | ------------------------------------------------- |
| **Existence**  | Display / containment context                     | `hidden`, `block`, `@container`, `group`, `peer`  |
| **Position**   | Where the box sits                                | `absolute`, `inset-*`, `top-*`, `z-*`             |
| **Layout**     | How children flow                                 | `flex`, `grid`, `gap-*`, `items-*`                |
| **Sizing**     | Box dimensions and overflow                       | `w-*`, `h-*`, `aspect-*`, `overflow-*`            |
| **Spacing**    | Padding and margin only (gaps stay with Layout)   | `p-*`, `m-*`                                      |
| **Shape**      | Corners and strokes                               | `rounded-*`, `border-*`, `ring-*`                 |
| **Background** | Surfaces and masks                                | `bg-*`, `from-*`, `via-*`, `to-*`, `mask-*`       |
| **Shadow**     | Depth                                             | `shadow-*`, `inset-shadow-*`, `text-shadow-*`     |
| **Typography** | Text appearance                                   | `font-*`, `text-*`, `leading-*`                   |
| **Composite**  | Layers and transforms — 3D context → 3D → 2D      | `opacity-*`, `rotate-x-*`, `translate-*`          |
| **Motion**     | Time-based change                                 | `transition-*`, `animate-*`                       |
| **Starting**   | Tailwind's `starting:` layer, kept next to Motion | `starting:*`                                      |
| **Behavior**   | Input / scrolling / chrome                        | `cursor-*`, `scroll-*`, `field-sizing-*`, `inert` |
| **State**      | Interactive/conditional variants (non-selector)   | `hover:`, `md:`, `@md/sidebar:`, `data-[…]:`      |
| **Selector**   | Selector-driven variants                          | `[&…]:`, `*:`, `**:`, `has-*`, `group-[…]:`       |

Some adjacent buckets may be merged into one string literal when declared _compatible_ (e.g. `layout` + `sizing`) — keeps `cn()` readable without flattening unrelated concerns.

To change a placement, edit `classifyBareUtility` in `src/lib/arrange/tokenizer.ts` and add a `classifyToken` test in `src/lib/arrange.test.ts`.

---

## `mirror sync`

Run from anywhere under the monorepo — the CLI finds the root via `pnpm-workspace.yaml`.

```bash
codefast mirror sync              # All workspace packages
codefast mirror sync packages/ui  # One package only
codefast mirror sync -v           # Verbose
```

**Config:** Place `codefast.config.js` (or `.mjs` / `.cjs` / `.json`) at repo root with a `mirror` object (`skipPackages`, `pathTransformations`, `customExports`, …).

> ⚠️ `.js`/`.mjs`/`.cjs` config files are loaded via `import()` — only run `mirror sync` in repositories you trust.

---

## Developing inside this monorepo

```bash
pnpm exec codefast --help
```

Root `package.json` defines optional `cli:*` scripts (e.g. `cli:mirror-sync`, `cli:arrange-analyze`) as thin wrappers around `pnpm exec codefast …`.
