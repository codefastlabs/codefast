# @codefast/ui

Core UI components library built with React, Tailwind CSS, and Radix UI for creating modern, accessible, and customizable user interfaces with a comprehensive design system.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/ui.svg)](https://www.npmjs.com/package/@codefast/ui)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/ui)](https://bundlephobia.com/package/@codefast/ui)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Styling Integration](#styling-integration)
  - [SSR with Nitro (TanStack Start)](#ssr-with-nitro-tanstack-start)
- [Quick Start](#quick-start)
- [Components](#components)
  - [Layout](#layout)
  - [Form](#form)
  - [Navigation](#navigation)
  - [Overlay](#overlay)
  - [Data Display](#data-display)
- [Usage Examples](#usage-examples)
- [Theming and Customization](#theming-and-customization)
- [API Reference](#api-reference)
- [Accessibility](#accessibility)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Overview

`@codefast/ui` provides **60+ accessible components** for building production-grade user interfaces. Every component is built on [Radix UI](https://radix-ui.com/) primitives, styled with [Tailwind CSS 4](https://tailwindcss.com/), and fully typed with TypeScript.

**Key features:**

- **60+ Components** -- Layout, form, navigation, overlay, and data display categories.
- **Accessible by Default** -- WAI-ARIA compliant with keyboard navigation and screen reader support.
- **Fully Typed** -- Complete TypeScript definitions for all components and props.
- **Customizable** -- Extend styles with Tailwind CSS utility classes or Tailwind Variants.
- **Tree-shakeable** -- Import only the components you use.

## Installation

```bash
pnpm add @codefast/ui
```

Or using npm:

```bash
npm install @codefast/ui
```

**Peer dependencies:**

```bash
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

**Requirements:**

- Node.js >= 24.0.0 (LTS)
- React >= 19.0.0
- TypeScript >= 5.9.2 (recommended)
- Tailwind CSS 4.x (for styling)

## Styling Integration

`@codefast/ui` requires CSS styles to render correctly. Choose one of the following approaches based on your project setup.

### Option 1: Project Already Uses Tailwind CSS (Recommended)

If your project already has Tailwind CSS 4.x configured (e.g. Vite, Next.js, TanStack Start), import only the **theme variables** and **preset** to avoid duplicate Tailwind output:

**1. In your main CSS file** (e.g. `src/styles.css` or `src/index.css`):

```css
@import "tailwindcss";

/* @codefast/ui – theme variables & preset (must come after tailwindcss) */
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";
```

**2. Select a theme.** Available themes (replace `slate` with any below):

| Theme   | Import Path                    |
| ------- | ------------------------------ |
| slate   | `@codefast/ui/css/slate.css`   |
| gray    | `@codefast/ui/css/gray.css`    |
| zinc    | `@codefast/ui/css/zinc.css`    |
| neutral | `@codefast/ui/css/neutral.css` |
| stone   | `@codefast/ui/css/stone.css`   |
| red     | `@codefast/ui/css/red.css`     |
| orange  | `@codefast/ui/css/orange.css`  |
| amber   | `@codefast/ui/css/amber.css`   |
| yellow  | `@codefast/ui/css/yellow.css`  |
| lime    | `@codefast/ui/css/lime.css`    |
| green   | `@codefast/ui/css/green.css`   |
| emerald | `@codefast/ui/css/emerald.css` |
| teal    | `@codefast/ui/css/teal.css`    |
| cyan    | `@codefast/ui/css/cyan.css`    |
| sky     | `@codefast/ui/css/sky.css`     |
| blue    | `@codefast/ui/css/blue.css`    |
| indigo  | `@codefast/ui/css/indigo.css`  |
| violet  | `@codefast/ui/css/violet.css`  |
| purple  | `@codefast/ui/css/purple.css`  |
| fuchsia | `@codefast/ui/css/fuchsia.css` |
| pink    | `@codefast/ui/css/pink.css`    |
| rose    | `@codefast/ui/css/rose.css`    |

**3. Dark mode.** All themes include light/dark variants. Add the `.dark` class to `<html>` or `<body>` to enable dark mode:

```tsx
// Example: toggle dark mode
document.documentElement.classList.toggle("dark", isDark);
```

### Option 2: Standalone (No Existing Tailwind)

If your project does **not** use Tailwind yet, import the full stylesheet (includes Tailwind + theme + preset):

```tsx
// In your app entry (e.g. main.tsx, _app.tsx)
import "@codefast/ui/css/style.css";
```

> **Note:** This bundles Tailwind CSS. Ensure your build tool (Vite, webpack, etc.) can process CSS `@import`. You may need `@tailwindcss/vite` or `@tailwindcss/postcss` in devDependencies.

### Option 3: Framework-Specific Setup

**Vite (with `@tailwindcss/vite`):**

```css
/* src/styles.css */
@import "tailwindcss";
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";
```

**Next.js (App Router):**

```css
/* app/globals.css */
@import "tailwindcss";
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";
```

**TanStack Start:**

```css
/* src/styles.css */
@import "tailwindcss";
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";
```

#### SSR with Nitro (TanStack Start)

Use this when you ship with **[Nitro](https://v3.nitro.build/)** (e.g. Vercel, Node) and **Vite 8** (Rolldown) via **TanStack Start**.

**If you see** a server `TypeError` about `__extends` and `__toESM(...).default` (sometimes minified as `__toESM$1`), often during SSR or route loaders, configure `vite.config.ts` as below.

##### Recommended: `nitro.exportConditions`

Prefer ESM entry points from dependencies (`import` / `module` in `package.json` `exports`). That avoids pulling CommonJS builds that `require("tslib")`, which can trip Rolldown’s CJS→ESM interop. Nitro still merges in `production` / `development`, `node`, and related conditions.

```ts
// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  nitro: {
    exportConditions: ["import", "module", "default"],
  },
  // plugins: [ tanstackStart(), nitro(), … ]
});
```

##### Fallback: `resolve.alias`

If the error persists, point `tslib` at its ESM file:

```ts
export default defineConfig({
  resolve: {
    alias: { tslib: "tslib/tslib.es6.mjs" },
  },
});
```

##### Why it happens (short)

- **Bundler:** Rolldown may wrap `tslib`’s CJS build and read helpers from `.default` in a way that breaks when the module is marked `__esModule`.
- **Dependencies:** Overlay-related packages (Dialog, Sheet, Menu, …) often pull in utilities such as [`react-remove-scroll-bar`](https://www.npmjs.com/package/react-remove-scroll-bar). Their legacy CJS output can use `require("tslib")` even when your app source is ESM.

> **Note:** Don’t use `nitro.alias` for the bare specifier `tslib`. In Nitro v3 that option is for unenv-style path overrides, not npm package names, and can produce broken paths.

### Troubleshooting

| Issue                                                    | Solution                                                                                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Components look unstyled                                 | Ensure CSS imports run before any component renders (entry point first).                                                                                  |
| Duplicate Tailwind CSS                                   | Use Option 1 (theme + preset only), **not** `style.css`.                                                                                                  |
| Dark mode not working                                    | Add `class="dark"` to `<html>` when dark mode is active.                                                                                                  |
| Build: CSS not found                                     | Verify path: `@codefast/ui/css/[theme].css` (e.g. `slate.css`).                                                                                           |
| SSR / loaders: `Cannot destructure property '__extends'` | Set `nitro.exportConditions: ['import', 'module', 'default']`, or add `resolve.alias` for `tslib` (see [SSR with Nitro](#ssr-with-nitro-tanstack-start)). |

### Customizing Theme

Override CSS variables in your own CSS after imports:

```css
@import "@codefast/ui/css/slate.css";
@import "@codefast/ui/css/preset.css";

:root {
  --radius: 0.5rem; /* Increase border radius */
  --primary: oklch(0.4 0.2 260); /* Custom primary color */
}
```

## Quick Start

After integrating styles (see [Styling Integration](#styling-integration)), import and use components:

```tsx
import { Button, Card, CardContent, CardHeader, CardTitle } from "@codefast/ui";

function App() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome to CodeFast UI</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          A comprehensive UI components library built with React and Tailwind CSS.
        </p>
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

## Components

### Layout

| Component   | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| Card        | Content container with header, content, and footer sections |
| Separator   | Visual divider between content sections                     |
| AspectRatio | Maintain consistent aspect ratios for media content         |

### Form

| Component  | Description                                         |
| ---------- | --------------------------------------------------- |
| Button     | Interactive button with multiple variants and sizes |
| Input      | Text input with validation support                  |
| Checkbox   | Individual checkbox and checkbox groups             |
| RadioGroup | Radio button group for single selection             |
| Select     | Dropdown selection component                        |
| Switch     | Toggle switch for boolean values                    |
| Slider     | Range input slider                                  |
| Label      | Form label with accessibility features              |

### Navigation

| Component      | Description                            |
| -------------- | -------------------------------------- |
| Breadcrumb     | Navigation breadcrumb trail            |
| NavigationMenu | Complex navigation menus with submenus |
| Menubar        | Application menu bar                   |
| Tabs           | Tabbed interface with content panels   |

### Overlay

| Component   | Description                          |
| ----------- | ------------------------------------ |
| Dialog      | Modal dialog and popup               |
| AlertDialog | Confirmation and alert dialog        |
| Popover     | Contextual popover                   |
| Tooltip     | Informational tooltip                |
| HoverCard   | Rich hover card with preview content |

### Data Display

| Component | Description                      |
| --------- | -------------------------------- |
| Avatar    | User profile image with fallback |
| Badge     | Status indicator and label       |
| Alert     | System message and notification  |
| Progress  | Progress indicator               |
| Accordion | Expandable content sections      |
| Calendar  | Date selection calendar          |
| Carousel  | Content carousel and slider      |

## Usage Examples

### Form Components

```tsx
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@codefast/ui";
import { useState } from "react";

function ContactForm() {
  const [email, setEmail] = useState("");

  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Contact Us</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button className="w-full">Submit</Button>
      </CardContent>
    </Card>
  );
}
```

### Navigation Components

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui";

function TabExample() {
  return (
    <Tabs defaultValue="account" className="w-96">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="mt-4">
        <p>Make changes to your account here.</p>
      </TabsContent>
      <TabsContent value="password" className="mt-4">
        <p>Change your password here.</p>
      </TabsContent>
    </Tabs>
  );
}
```

### Overlay Components

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from "@codefast/ui";

function DialogExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">{/* Form content */}</div>
      </DialogContent>
    </Dialog>
  );
}
```

## Theming and Customization

All components use CSS custom properties (`--primary`, `--background`, `--radius`, etc.). You can:

1. **Switch themes** — Import a different theme file (e.g. `zinc.css` instead of `slate.css`).
2. **Override variables** — Define your own values in `:root` or `.dark` after imports (see [Customizing Theme](#customizing-theme)).
3. **Use a theme provider** — For system/light/dark switching, add/remove `dark` class on `<html>`; many apps use `next-themes` or similar for persistence.

## API Reference

### Common Props

Most components accept these common props:

| Prop        | Type              | Default     | Description            |
| ----------- | ----------------- | ----------- | ---------------------- |
| `className` | `string`          | `undefined` | Additional CSS classes |
| `children`  | `React.ReactNode` | `undefined` | Child elements         |

### TypeScript Support

All components export their prop types for use in custom wrappers:

```tsx
import type { ButtonProps, CardProps, InputProps } from "@codefast/ui";

function MyCustomButton(props: ButtonProps) {
  return <Button {...props} />;
}
```

### Component Prop Types

**Layout:** `CardProps`, `SeparatorProps`, `AspectRatioProps`

**Form:** `ButtonProps`, `InputProps`, `LabelProps`, `CheckboxProps`, `RadioGroupProps`, `SelectProps`, `SwitchProps`, `SliderProps`

**Navigation:** `TabsProps`, `NavigationMenuProps`, `BreadcrumbProps`, `MenubarProps`

**Overlay:** `DialogProps`, `AlertDialogProps`, `PopoverProps`, `TooltipProps`, `HoverCardProps`

## Accessibility

All components follow [WAI-ARIA](https://www.w3.org/WAI/ARIA/apg/) guidelines and provide:

- **Keyboard Navigation** -- Full keyboard support for all interactive elements.
- **Screen Reader Support** -- Proper ARIA labels and descriptions.
- **Focus Management** -- Logical focus order and visible focus indicators.
- **High Contrast** -- Support for high contrast themes.
- **Reduced Motion** -- Respects the `prefers-reduced-motion` media query.

### Keyboard Shortcuts

| Key                 | Action                                |
| ------------------- | ------------------------------------- |
| `Tab` / `Shift+Tab` | Navigate between focusable elements   |
| `Enter` / `Space`   | Activate buttons and controls         |
| `Arrow Keys`        | Navigate within component groups      |
| `Escape`            | Close overlays and cancel actions     |
| `Home` / `End`      | Navigate to first/last items in lists |

## Browser Compatibility

`@codefast/ui` supports all modern browsers:

| Browser | Version         |
| ------- | --------------- |
| Chrome  | Last 2 versions |
| Firefox | Last 2 versions |
| Safari  | Last 2 versions |
| Edge    | Last 2 versions |

> Internet Explorer is not supported.

## Contributing

We welcome contributions! Please see the [contributing guide](../../README.md#contributing) in the root of this repository for detailed instructions.

For package-specific development:

```bash
# Development mode
pnpm dev --filter=@codefast/ui

# Run tests
pnpm test --filter=@codefast/ui

# Run tests with coverage
pnpm test:coverage --filter=@codefast/ui
```

Package build/dev scripts use TypeScript directly via `tsc -p tsconfig.build.json` (watch mode for `pnpm dev --filter=@codefast/ui`).

CSS entry exports under `@codefast/ui/css/*` are sourced from `src/css/*`.

### Adding New Components

1. Create component files in `src/components/[component-name]/`.
2. Export the component and types from the package entry point.
3. Add comprehensive tests.
4. Update documentation.
5. Submit a pull request.

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
