# @codefast/ui

70+ accessible React components built on [Radix UI](https://www.radix-ui.com/) primitives and styled with Tailwind CSS
4, for teams that want a typed, themeable component library they can import one piece at a time.

[![npm version](https://img.shields.io/npm/v/@codefast/ui)](https://www.npmjs.com/package/@codefast/ui)
[![license](https://img.shields.io/npm/l/@codefast/ui)](./LICENSE)

## Overview

`@codefast/ui` is a library of accessible React components you import one at a time. Each component is built on a Radix
UI primitive, styled with Tailwind CSS 4, and typed down to its props. You theme the whole set in plain CSS, and switch
light and dark without JavaScript.

You bring the Tailwind pipeline; the package ships the components and their stylesheets as source.

- **Accessible by construction.** Keyboard navigation, focus management, and ARIA semantics come from Radix UI
  primitives.
- **Fully typed.** Every component exports its prop types — `ButtonProps`, `DialogContentProps`, and so on — for
  wrappers and composition.
- **Tree-shakeable ESM.** Each component is its own subpath export, so your bundler includes only what you import.
- **Themeable in plain CSS.** Palettes of `oklch` design tokens with a `.dark` variant, switchable without JavaScript.
- **Hooks, variants, and utilities included.** The building blocks behind the components are exported too.

## Installation

```bash
pnpm add @codefast/ui
```

Or the equivalent with your package manager: `npm install @codefast/ui`, `yarn add @codefast/ui`, or
`bun add @codefast/ui`.

`@codefast/ui` requires:

- Node.js 24 or later.
- React 19 — `react` and `react-dom` (19 or later) are peer dependencies; `@types/react` and `@types/react-dom` are
  optional peers.
- Tailwind CSS 4 at build time — the stylesheets are Tailwind source, and rely on your Tailwind pipeline to compile
  them.

The package is published on 0.x and versioned on its own track: breaking changes ship as minor versions, so pin the
minor version when you need stability.

## Quick start

Import Tailwind, a palette, and the preset — in that order — in your global stylesheet:

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

`@codefast/ui/css/style.css` bundles those three imports into one entry. Use it when the neutral palette is the one you
want:

```css
@import "@codefast/ui/css/style.css";
```

## Per-component imports

Every component ships as its own subpath export, named after the component, so your bundle carries only what you use:

```tsx
import { Button } from "@codefast/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@codefast/ui/dialog";
```

Prop types travel with their component:

```tsx
import type { ButtonProps } from "@codefast/ui/button";

export function SubmitButton(props: ButtonProps) {
  return <Button type="submit" {...props} />;
}
```

All components, prop types, hooks, and variants are also re-exported from the root entry, `@codefast/ui`.

Beyond the components, the package exposes:

- `@codefast/ui/hooks/*` — standalone hooks such as `useMediaQuery` (`@codefast/ui/hooks/use-media-query`),
  `useIsMobile`, `useCopyToClipboard`, `useMutationObserver`, and `usePagination`.
- `@codefast/ui/variants/*` — the variant functions behind the styled components, such as `buttonVariants` from
  `@codefast/ui/variants/button`, for styling an element that isn't the component itself.
- `@codefast/ui/primitives/*` — unstyled building blocks the styled components are composed from.
- `@codefast/ui/lib/utils` — `cn()` for merging class names and `tv()` for declaring variants, plus the `VariantProps`
  type.

For example, to style a link like a button:

```tsx
import { buttonVariants } from "@codefast/ui/variants/button";
import { cn } from "@codefast/ui/lib/utils";

export function DocsLink() {
  return (
    <a className={cn(buttonVariants({ variant: "outline", size: "sm" }), "no-underline")} href="/docs">
      Read the docs
    </a>
  );
}
```

## Theming

Theme tokens live in plain CSS files. Swap `themes/neutral.css` in the imports above for any palette under
`@codefast/ui/css/themes/`:

```
amber · blue · cyan · emerald · fuchsia · gray · green · indigo · lime · neutral · orange
pink · purple · red · rose · sky · slate · stone · teal · violet · yellow · zinc
```

Each palette defines light tokens on `:root` and dark tokens under `.dark`. Toggle the dark color scheme by adding the
`dark` class to `<html>`, or any ancestor:

```ts
document.documentElement.classList.toggle("dark", isDark);
```

To customize, override CSS custom properties after the imports. Palette tokens such as `--primary` come from the theme
file; shape tokens such as `--radius` come from the preset — so declare your overrides after both:

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

- [codefastlabs.com/ui](https://codefastlabs.com/ui) — live previews and copy-ready source for every component:
  [getting started](https://codefastlabs.com/ui/about) and the
  [component gallery](https://codefastlabs.com/ui/components).
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for every published version.

## Contributing

The package is developed in the [codefast monorepo](https://github.com/codefastlabs/codefast); the repo-wide
[contributing guide](../../CONTRIBUTING.md) covers setup, the test taxonomy, and the release flow.

## License

Released under the [MIT License](./LICENSE).
