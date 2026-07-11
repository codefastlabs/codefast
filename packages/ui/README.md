# @codefast/ui

70+ accessible React components built on [Radix UI](https://www.radix-ui.com/) primitives and styled with Tailwind CSS 4 — fully typed, tree-shakeable, themeable.

[![npm version](https://img.shields.io/npm/v/@codefast/ui)](https://www.npmjs.com/package/@codefast/ui)
[![license](https://img.shields.io/npm/l/@codefast/ui)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

**[codefastlabs.com](https://codefastlabs.com)** — full documentation with live previews and copy-ready source for every component.

## Highlights

- **70+ accessible components** — keyboard navigation, focus management, and ARIA semantics come from Radix UI primitives.
- **Fully typed** — every component exports its prop types (`ButtonProps`, `DialogContentProps`, …) for use in wrappers.
- **Tree-shakeable ESM** — per-component subpath exports mean bundlers only include what you import.
- **Themeable in plain CSS** — 22 palettes of `oklch` design tokens, dark mode included, no JavaScript required.

## Requirements

- React 19 (`react` and `react-dom` are peer dependencies; `@types/react` and `@types/react-dom` are optional peers)
- Tailwind CSS 4 at build time

## Installation

```bash
pnpm add @codefast/ui
```

Or the equivalent with your package manager: `npm install @codefast/ui`, `yarn add @codefast/ui`, or `bun add @codefast/ui`.

The package is in canary pre-release on the way to 1.0. To follow the canary channel:

```bash
pnpm add @codefast/ui@canary
```

## Quick Start

Import a theme and the preset after `tailwindcss` in your global stylesheet:

```css
@import "tailwindcss";
@import "@codefast/ui/css/themes/neutral.css";
@import "@codefast/ui/css/preset.css";
```

Then use any component:

```tsx
import { Button } from "@codefast/ui/button";

export function MyPage() {
  return <Button variant="outline">Click me</Button>;
}
```

If your app doesn't run Tailwind itself, import the bundled stylesheet instead — it includes Tailwind 4, the neutral theme, and the preset in one file:

```css
@import "@codefast/ui/css/style.css";
```

## Per-component imports

Every component ships as its own subpath export, so bundlers only pull in what you import:

```tsx
import { Button } from "@codefast/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@codefast/ui/dialog";
```

All components and their prop types (`ButtonProps`, `DialogContentProps`, …) are also re-exported from the root entry `@codefast/ui`.

Beyond components, the package exposes:

- `@codefast/ui/hooks/*` — standalone hooks, e.g. `useMediaQuery` from `@codefast/ui/hooks/use-media-query`
- `@codefast/ui/variants/*` — the underlying variant functions, e.g. `buttonVariants` from `@codefast/ui/variants/button` for styling custom elements
- `@codefast/ui/primitives/*` — unstyled building blocks used by the styled components
- `@codefast/ui/lib/utils` — the `cn()` classname merge helper

## Theming

Theme tokens live in plain CSS files. Swap `themes/neutral.css` in the import above for any palette under `@codefast/ui/css/themes/`:

```
amber · blue · cyan · emerald · fuchsia · gray · green · indigo · lime · neutral · orange
pink · purple · red · rose · sky · slate · stone · teal · violet · yellow · zinc
```

Each palette defines light tokens on `:root` and dark tokens under `.dark`. Toggle dark mode by adding the `dark` class to `<html>` (or any ancestor):

```ts
document.documentElement.classList.toggle("dark", isDark);
```

Customize by overriding CSS custom properties after the imports:

```css
@import "tailwindcss";
@import "@codefast/ui/css/themes/neutral.css";
@import "@codefast/ui/css/preset.css";

:root {
  --radius: 0.5rem;
  --primary: oklch(0.4 0.2 260);
}

.dark {
  --primary: oklch(0.72 0.18 260);
}
```

## Documentation

Browse the full component gallery — live previews, usage examples, and copy-ready source — at **[codefastlabs.com](https://codefastlabs.com)**.

The package is developed in the [codefast monorepo](https://github.com/codefastlabs/codefast); see the [changelog](https://github.com/codefastlabs/codefast/blob/main/packages/ui/CHANGELOG.md) for release history.

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)
