# @codefast/ui

Accessible, typed React components built on Radix UI primitives and styled with Tailwind CSS 4.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/ui)](https://bundlephobia.com/package/@codefast/ui)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Highlights](#highlights)
- [Requirements](#requirements)
- [Installation](#installation)
- [Styling](#styling)
  - [With an existing Tailwind 4 setup (recommended)](#with-an-existing-tailwind-4-setup-recommended)
  - [Standalone (no Tailwind yet)](#standalone-no-tailwind-yet)
  - [Theme palettes](#theme-palettes)
  - [Dark mode](#dark-mode)
  - [Customizing tokens](#customizing-tokens)
- [Quick Start](#quick-start)
- [Component catalog](#component-catalog)
- [Hooks](#hooks)
- [Primitives and utilities](#primitives-and-utilities)
- [SSR with Nitro (TanStack Start)](#ssr-with-nitro-tanstack-start)
- [Troubleshooting](#troubleshooting)
- [Accessibility](#accessibility)
- [Browser support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Highlights

- **62+ components** across layout, form, navigation, overlay, and data-display categories.
- **Built on [Radix UI](https://www.radix-ui.com/)** — keyboard navigation, focus management, and ARIA semantics come for free.
- **Tailwind CSS 4** tokens shipped as CSS files (`@codefast/ui/css/*`), with 22 palette variants and a dark-mode scheme.
- **Fully typed.** Every component exports its props (`ButtonProps`, `DialogContentProps`, …) for use in wrappers.
- **Side-effect-free ESM** with per-component subpaths — bundlers tree-shake to what you actually import.
- **Dependency-light.** Only the Radix + headless-UI libraries that each component needs are pulled in.

---

## Requirements

- React `^19` and `react-dom` (peer; `@types/*` are optional peers)
- Tailwind CSS `4.x` at build time (only if you use one of the theme CSS imports)
- TypeScript `>= 5.9` (recommended)

---

## Installation

```bash
pnpm add @codefast/ui
# or
npm install @codefast/ui
```

Peers:

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

---

## Styling

`@codefast/ui` ships theme tokens and component-layer styles as CSS files under `@codefast/ui/css/*`. Pick the integration that matches your project.

### With an existing Tailwind 4 setup (recommended)

Import the palette and the preset **after** `tailwindcss` so Tailwind isn't duplicated:

```css
/* src/styles.css (or app/globals.css, …) */
@import "tailwindcss";

/* @codefast/ui tokens + preset */
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";
```

Then import the stylesheet once from your app entry:

```ts
import "./styles.css";
```

Works the same for Vite (`@tailwindcss/vite`), Next.js (App Router), and TanStack Start.

### Standalone (no Tailwind yet)

If your app doesn't run Tailwind, import the bundled stylesheet — it includes Tailwind 4 plus the default palette and preset:

```ts
import "@codefast/ui/css/style.css";
```

Make sure your bundler can process CSS `@import` (Vite and Next.js do this out of the box; for other setups, add `@tailwindcss/postcss` or `@tailwindcss/vite`).

### Theme palettes

Replace `slate.css` with any of the palettes below:

```
amber · blue · cyan · emerald · fuchsia · gray · green · indigo · lime · neutral
orange · pink · purple · red · rose · sky · slate · stone · teal · violet · yellow · zinc
```

Each palette defines a light set on `:root` and a dark set under `.dark`.

### Dark mode

Toggle the `dark` class on `<html>` (or any ancestor) to switch schemes:

```ts
document.documentElement.classList.toggle("dark", isDark);
```

Pair with [`@codefast/theme`](../theme/README.md) for SSR-safe theme management and cross-tab sync.

### Customizing tokens

Override CSS custom properties after the imports:

```css
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";

:root {
  --radius: 0.5rem;
  --primary: oklch(0.4 0.2 260);
}

.dark {
  --primary: oklch(0.72 0.18 260);
}
```

---

## Quick Start

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@codefast/ui";

export function Hero() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome to Codefast UI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>A typed React component library built on Radix and Tailwind CSS 4.</p>
        <Button>Get started</Button>
      </CardContent>
    </Card>
  );
}
```

Prefer per-component imports when you care about bundle visibility:

```tsx
import { Button } from "@codefast/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@codefast/ui/dialog";
```

Every subpath from the table below is tree-shakeable and ships its own types.

---

## Component catalog

All components are also re-exported from the root entry `@codefast/ui`.

### Layout & structure

| Component     | Subpath                     | Notes                                         |
| ------------- | --------------------------- | --------------------------------------------- |
| `AspectRatio` | `@codefast/ui/aspect-ratio` | Maintain a consistent width/height ratio.     |
| `Card`        | `@codefast/ui/card`         | Container with header/content/footer.         |
| `Resizable`   | `@codefast/ui/resizable`    | Split-panel layouts (react-resizable-panels). |
| `ScrollArea`  | `@codefast/ui/scroll-area`  | Styled scroll container with custom bars.     |
| `Separator`   | `@codefast/ui/separator`    | Decorative or semantic divider.               |
| `Sidebar`     | `@codefast/ui/sidebar`      | App shell sidebar primitive.                  |
| `Skeleton`    | `@codefast/ui/skeleton`     | Loading placeholder.                          |

### Forms & inputs

| Component        | Subpath                                   | Notes                                     |
| ---------------- | ----------------------------------------- | ----------------------------------------- |
| `Button`         | `@codefast/ui/button`                     | Variants + sizes via Tailwind Variants.   |
| `ButtonGroup`    | `@codefast/ui/button-group`               | Segmented button container.               |
| `Checkbox`       | `@codefast/ui/checkbox`                   | Single checkbox.                          |
| `CheckboxCards`  | `@codefast/ui/checkbox-cards`             | Card-style multi-select.                  |
| `CheckboxGroup`  | `@codefast/ui/checkbox-group`             | Controlled multi-select group.            |
| `Field` / `Form` | `@codefast/ui/field`, `@codefast/ui/form` | Form primitives, integrates with RHF.     |
| `Input`          | `@codefast/ui/input`                      | Standard text input.                      |
| `InputGroup`     | `@codefast/ui/input-group`                | Prefixed / suffixed composite input.      |
| `InputNumber`    | `@codefast/ui/input-number`               | Numeric stepper with keyboard support.    |
| `InputOTP`       | `@codefast/ui/input-otp`                  | One-time-password code input (input-otp). |
| `InputPassword`  | `@codefast/ui/input-password`             | Password field with visibility toggle.    |
| `InputSearch`    | `@codefast/ui/input-search`               | Search field with clear affordance.       |
| `Label`          | `@codefast/ui/label`                      | Accessible form label.                    |
| `NativeSelect`   | `@codefast/ui/native-select`              | Styled `<select>` wrapper.                |
| `Radio`          | `@codefast/ui/radio`                      | Single radio button.                      |
| `RadioCards`     | `@codefast/ui/radio-cards`                | Card-style single-select.                 |
| `RadioGroup`     | `@codefast/ui/radio-group`                | Controlled single-select group.           |
| `Select`         | `@codefast/ui/select`                     | Rich dropdown (Radix Select).             |
| `Slider`         | `@codefast/ui/slider`                     | Range slider.                             |
| `Switch`         | `@codefast/ui/switch`                     | Boolean toggle.                           |
| `Textarea`       | `@codefast/ui/textarea`                   | Multi-line input.                         |
| `Toggle`         | `@codefast/ui/toggle`                     | Pressable toggle button.                  |
| `ToggleGroup`    | `@codefast/ui/toggle-group`               | Grouped toggles.                          |

### Navigation

| Component        | Subpath                        | Notes                       |
| ---------------- | ------------------------------ | --------------------------- |
| `Breadcrumb`     | `@codefast/ui/breadcrumb`      | Breadcrumb trail.           |
| `Menubar`        | `@codefast/ui/menubar`         | Desktop-style menubar.      |
| `NavigationMenu` | `@codefast/ui/navigation-menu` | Top-level nav with flyouts. |
| `Pagination`     | `@codefast/ui/pagination`      | Page number controls.       |
| `Tabs`           | `@codefast/ui/tabs`            | Tabbed content.             |

### Overlay & feedback

| Component      | Subpath                      | Notes                                 |
| -------------- | ---------------------------- | ------------------------------------- |
| `AlertDialog`  | `@codefast/ui/alert-dialog`  | Confirm / destructive dialog.         |
| `Command`      | `@codefast/ui/command`       | Command palette (cmdk).               |
| `ContextMenu`  | `@codefast/ui/context-menu`  | Right-click menu.                     |
| `Dialog`       | `@codefast/ui/dialog`        | Modal dialog.                         |
| `Drawer`       | `@codefast/ui/drawer`        | Mobile-friendly drawer (vaul).        |
| `DropdownMenu` | `@codefast/ui/dropdown-menu` | Menu triggered from a button.         |
| `HoverCard`    | `@codefast/ui/hover-card`    | Rich hover preview.                   |
| `Popover`      | `@codefast/ui/popover`       | Floating panel anchored to a trigger. |
| `Sheet`        | `@codefast/ui/sheet`         | Side-sheet (dialog from edge).        |
| `Sonner`       | `@codefast/ui/sonner`        | Toast stack (sonner).                 |
| `Tooltip`      | `@codefast/ui/tooltip`       | Keyboard-friendly tooltip.            |

### Data display & content

| Component        | Subpath                        | Notes                           |
| ---------------- | ------------------------------ | ------------------------------- |
| `Accordion`      | `@codefast/ui/accordion`       | Collapsible sections.           |
| `Alert`          | `@codefast/ui/alert`           | Inline status message.          |
| `Avatar`         | `@codefast/ui/avatar`          | User avatar with fallback.      |
| `Badge`          | `@codefast/ui/badge`           | Status pill.                    |
| `Calendar`       | `@codefast/ui/calendar`        | Date picker (react-day-picker). |
| `Carousel`       | `@codefast/ui/carousel`        | Slider (embla-carousel).        |
| `Chart`          | `@codefast/ui/chart`           | Responsive charts (recharts).   |
| `Collapsible`    | `@codefast/ui/collapsible`     | Expand/collapse primitive.      |
| `Empty`          | `@codefast/ui/empty`           | Empty-state illustration block. |
| `Item`           | `@codefast/ui/item`            | List-item building block.       |
| `Kbd`            | `@codefast/ui/kbd`             | Keyboard-key styling.           |
| `Progress`       | `@codefast/ui/progress`        | Linear progress bar.            |
| `ProgressCircle` | `@codefast/ui/progress-circle` | Circular progress indicator.    |
| `Spinner`        | `@codefast/ui/spinner`         | Busy indicator.                 |
| `Table`          | `@codefast/ui/table`           | Semantic table + styled cells.  |

---

## Hooks

Available from `@codefast/ui/hooks/*`:

| Hook                  | Subpath                                    | Purpose                                          |
| --------------------- | ------------------------------------------ | ------------------------------------------------ |
| `useAnimatedValue`    | `@codefast/ui/hooks/use-animated-value`    | Tween a number over time with easing control.    |
| `useCopyToClipboard`  | `@codefast/ui/hooks/use-copy-to-clipboard` | Clipboard write with success state.              |
| `useIsMobile`         | `@codefast/ui/hooks/use-is-mobile`         | Boolean for the standard mobile breakpoint.      |
| `useMediaQuery`       | `@codefast/ui/hooks/use-media-query`       | Subscribe to a `matchMedia` query, SSR-safe.     |
| `useMutationObserver` | `@codefast/ui/hooks/use-mutation-observer` | Run a callback on DOM mutations.                 |
| `usePagination`       | `@codefast/ui/hooks/use-pagination`        | Page range / ellipsis helper for pagination UIs. |

---

## Primitives and utilities

Low-level building blocks, used internally by the styled components, exposed for custom wrappers.

| Import                                    | Contents                                                 |
| ----------------------------------------- | -------------------------------------------------------- |
| `@codefast/ui/primitives/input`           | Unstyled controlled-input primitive.                     |
| `@codefast/ui/primitives/input-number`    | Numeric stepper logic (keyboard, parsing, clamp).        |
| `@codefast/ui/primitives/checkbox-group`  | Controlled checkbox-group state machine.                 |
| `@codefast/ui/primitives/progress-circle` | Math + a11y primitive for circular progress.             |
| `@codefast/ui/lib/utils`                  | `cn()` — classname merge helper used by every component. |
| `@codefast/ui/css/*`                      | Palette + preset CSS files (see [Styling](#styling)).    |

```tsx
import { cn } from "@codefast/ui/lib/utils";

const classes = cn("rounded-md px-3 py-1", disabled && "opacity-50");
```

---

## SSR with Nitro (TanStack Start)

If you ship TanStack Start behind **[Nitro](https://v3.nitro.build/)** and **Vite 8 (Rolldown)**, you may hit a server-side `TypeError` referencing `__extends` or `__toESM(...).default` during route loaders or SSR. It originates from CJS `tslib` usage inside overlay-related dependencies (Dialog, Sheet, Menu, …) that reach for `react-remove-scroll-bar` and friends.

**Preferred fix** — make Nitro pick ESM entry points from those packages:

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  nitro: {
    exportConditions: ["import", "module", "default"],
  },
  // plugins: [tanstackStart(), nitro(), …],
});
```

**Fallback** — alias `tslib` to its ESM build:

```ts
export default defineConfig({
  resolve: {
    alias: { tslib: "tslib/tslib.es6.mjs" },
  },
});
```

> Don't use `nitro.alias` for the bare specifier `tslib`. In Nitro v3 that option is for unenv path overrides, not npm package names, and produces broken resolutions.

---

## Troubleshooting

| Issue                                            | Fix                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Components render unstyled                       | Make sure CSS imports run before the first component mounts (import from the app entry).          |
| Tailwind output is duplicated                    | Use the palette + `preset.css` import — don't also import `css/style.css` in the same app.        |
| Dark mode doesn't apply                          | Add the `dark` class to `<html>` (or any ancestor). See [Dark mode](#dark-mode).                  |
| `Cannot destructure property '__extends'` in SSR | Set `nitro.exportConditions: ["import", "module", "default"]` (see above).                        |
| Missing font or radius after palette switch      | Re-import the palette **before** `preset.css`. Preset depends on palette variables being defined. |

---

## Accessibility

Every component inherits Radix's accessibility guarantees and is audited with `jest-axe` in the test suite:

- Full keyboard navigation (`Tab`, arrows, `Enter` / `Space`, `Escape`, `Home` / `End`).
- Correct ARIA roles, `aria-expanded`, `aria-controls`, and live regions where relevant.
- Focus trap + restore for overlays (Dialog, AlertDialog, Sheet, Drawer, DropdownMenu, …).
- Respects `prefers-reduced-motion`.
- High-contrast friendly color tokens — palettes use `oklch` and ship explicit `--ring`, `--border` values.

---

## Browser support

Last two versions of Chrome, Edge, Firefox, and Safari. Internet Explorer is not supported.

---

## Contributing

This package lives in the [Codefast monorepo](https://github.com/codefastlabs/codefast). From the repo root:

```bash
pnpm --filter @codefast/ui build
pnpm --filter @codefast/ui dev          # watch build via tsdown
pnpm --filter @codefast/ui test
pnpm --filter @codefast/ui test:coverage
pnpm --filter @codefast/ui check-types
```

Adding a component:

1. Implement it under `src/components/<name>.tsx`.
2. Export the component and its prop types from `src/index.ts`.
3. Add a new subpath entry in `package.json → exports` following the existing pattern.
4. Add tests under `src/components/__tests__` (unit + `jest-axe` if interactive).
5. Run `pnpm --filter @codefast/ui build` to verify `tsdown` picks up the new entry.

CSS entry exports under `@codefast/ui/css/*` are sourced directly from `src/css/*`.

---

## License

[MIT](https://opensource.org/licenses/MIT) — see [`package.json`](./package.json).

Version history is published on [npm](https://www.npmjs.com/package/@codefast/ui?activeTab=versions) and mirrored in [`CHANGELOG.md`](./CHANGELOG.md).
