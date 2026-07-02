# @codefast/theme

Client-side color-scheme management for React 19 — `localStorage` persistence, FOUC-free first paint, SSR-safe `automatic` resolution, optimistic updates, and cross-tab sync.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/theme.svg)](https://www.npmjs.com/package/@codefast/theme)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/theme.svg)](https://www.npmjs.com/package/@codefast/theme)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/theme)](https://bundlephobia.com/package/@codefast/theme)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Why @codefast/theme](#why-codefasttheme)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Recipes](#recipes)
  - [TanStack Start](#tanstack-start)
  - [Color scheme toggle](#color-scheme-toggle)
- [SSR and FOUC prevention](#ssr-and-fouc-prevention)
- [API Reference](#api-reference)
  - [`<AppearanceProvider>`](#appearanceprovider)
  - [`useColorScheme()`](#usecolorscheme)
  - [`<AppearanceScript>`](#appearancescript)
  - [`resolveColorScheme()`](#resolvecolorscheme)
  - [`getSystemColorScheme()` / `applyColorScheme()` / `suppressTransitions()`](#getsystemcolorscheme--applycolorscheme--suppresstransitions)
  - [`colorSchemes`, `colorSchemeSchema`, and defaults](#colorschemes-colorschemeschema-and-defaults)
- [Package exports](#package-exports)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Why @codefast/theme

`@codefast/theme` is a focused color-scheme state primitive built around the React 19 concurrent APIs. Drop it at the root of your app and let the hook and inline script keep the DOM in sync — the preference lives entirely on the client, in `localStorage`, so no server round-trip is ever needed.

- **React 19 first.** Uses `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent` to keep color scheme changes immediate, hydration-safe, and free of needless re-renders.
- **No flash, anywhere.** A tiny inline `<AppearanceScript>` reads `localStorage` and applies the right class before first paint — including on statically prerendered / CDN-served HTML.
- **Zero server wiring.** No cookies, loaders, or server functions. Works the same in any React framework, SSR or not.
- **Cross-tab sync.** Color scheme changes propagate between tabs over `BroadcastChannel`, with the `storage` event as fallback.
- **Optimistic setters.** `setColorScheme(value)` updates the UI immediately and reverts automatically if persistence fails.
- **Tree-shakeable.** Side-effect-free ESM with granular subpaths; bring in only the pieces you use.

---

## Requirements

- React `>=19.0.0` (and `react-dom`)
- TypeScript `>= 5.9` (recommended; the published types target ES2022)

---

## Installation

```bash
pnpm add @codefast/theme
# or
npm install @codefast/theme
# or
yarn add @codefast/theme
```

Peer dependencies:

```bash
pnpm add react react-dom
```

---

## Quick Start

```tsx
import { AppearanceProvider, useColorScheme } from "@codefast/theme";

function App() {
  return (
    <AppearanceProvider>
      <Page />
    </AppearanceProvider>
  );
}

function Page() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <button onClick={() => setColorScheme(colorScheme === "dark" ? "light" : "dark")}>
      Current color scheme: {colorScheme}
    </button>
  );
}
```

`colorScheme` accepts `"light"`, `"dark"`, or `"automatic"`. `resolvedColorScheme` from `useColorScheme()` always narrows to `"light" | "dark"`. The preference is persisted in `localStorage` under `STORAGE_KEY` (`"ui-theme"`) by default; pass a custom `storageKey` to both `<AppearanceScript>` and `<AppearanceProvider>` to change it.

---

## Recipes

### TanStack Start

The shell keeps full control over `<html>` / `<head>` / `<body>`. Server-rendered HTML can't know the preference at request time, so render the defaults and let `<AppearanceScript>` correct the class before paint — `suppressHydrationWarning` absorbs the mismatch. No loader, no server function:

```tsx
// routes/__root.tsx (adjust to your router setup)
import {
  AppearanceProvider,
  AppearanceScript,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_RESOLVED_COLOR_SCHEME,
} from "@codefast/theme";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={DEFAULT_RESOLVED_COLOR_SCHEME}
      lang="en"
      style={{ colorScheme: DEFAULT_RESOLVED_COLOR_SCHEME }}
      data-appearance={DEFAULT_COLOR_SCHEME}
      suppressHydrationWarning
    >
      <head>
        <AppearanceScript />
        <HeadContent />
      </head>
      <body>
        <AppearanceProvider>{children}</AppearanceProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

The provider reads the preference from `localStorage` in its initial client render (so the first paint already matches it — no flash, no post-mount settle), auto-persists changes there, and syncs across tabs via the `storage` event. Because the script runs before first paint, this works unchanged for **statically prerendered / CDN-served** pages.

> SSR has no `localStorage`, so the server renders the `colorScheme` prop (default `"automatic"`). For a returning visitor whose stored preference differs, components that render preference-dependent markup hydrate-reconcile once; gate them behind a mounted flag if you need to avoid that.

### Color scheme toggle

```tsx
import { colorSchemes, useColorScheme } from "@codefast/theme";

export function ColorSchemeSelect() {
  const { colorScheme, setColorScheme, isPending } = useColorScheme();

  return (
    <select
      value={colorScheme}
      disabled={isPending}
      onChange={(event) => setColorScheme(event.target.value as (typeof colorSchemes)[number])}
    >
      {colorSchemes.map((value) => (
        <option key={value} value={value}>
          {value[0].toUpperCase() + value.slice(1)}
        </option>
      ))}
    </select>
  );
}
```

`colorSchemes` is `["light", "dark", "automatic"]`, so this renders every option without hard-coding the list.

---

## SSR and FOUC prevention

`<AppearanceScript>` injects a tiny synchronous `<script>` into the document head. It runs before first paint, reads the stored preference from `localStorage`, resolves `automatic` via `matchMedia`, and adds the appropriate class + `color-scheme` to `<html>`:

```tsx
<head>
  <AppearanceScript />
</head>
```

The script removes any prior `light` / `dark` / `automatic` class on `<html>`, so it is safe to pre-render the markup with `suppressHydrationWarning`.

It also writes the **preference** (`light` / `dark` / `automatic`, before resolving `automatic`) to a `data-appearance` attribute on `<html>` — and `<AppearanceProvider>` keeps it in sync. Preference-aware UI can then render purely from CSS (e.g. a 3-state toggle that shows a distinct "system" icon), correct on the first frame with no hydration flash:

```css
/* show the matching trigger icon based on the stored preference */
html[data-appearance="automatic"] .icon-system {
  display: block;
}
```

> **CSP note.** Pass a `nonce` to `<AppearanceScript nonce={...} />` when your policy requires it for inline scripts. The same nonce can also be passed to `<AppearanceProvider nonce={...} />` for the temporary inline `<style>` used by `disableTransition`.

---

## API Reference

### `<AppearanceProvider>`

Root provider that wires together color scheme state, `localStorage` persistence, OS subscription, optimistic updates, and cross-tab broadcast.

```tsx
<AppearanceProvider disableTransition nonce={cspNonce}>
  {children}
</AppearanceProvider>
```

| Prop                 | Type                                                          | Default       | Description                                                                                                                                     |
| -------------------- | ------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `colorScheme`        | `ColorScheme`                                                 | `"automatic"` | Fallback preference when storage has no valid entry; also what SSR renders.                                                                     |
| `storageKey`         | `string`                                                      | `"ui-theme"`  | `localStorage` key to restore from, auto-persist under, and sync across tabs via the `storage` event. Use the same key as `<AppearanceScript>`. |
| `persistColorScheme` | `(value: ColorScheme) => Promise<void>`                       | —             | Custom persistence; replaces the `localStorage` auto-persist. Rejects → optimistic update reverts automatically.                                |
| `onPersistError`     | `(error: unknown, attemptedColorScheme: ColorScheme) => void` | —             | Optional hook called when `persistColorScheme` rejects; use for custom logging/telemetry/UI feedback.                                           |
| `disableTransition`  | `boolean`                                                     | `false`       | Temporarily injects a style rule that disables CSS transitions while the color scheme swaps. Respects `prefers-reduced-motion`.                 |
| `nonce`              | `string`                                                      | —             | CSP nonce attached to the inline `<style>` element when `disableTransition` is enabled.                                                         |
| `children`           | `ReactNode`                                                   | —             | Application content.                                                                                                                            |

`<AppearanceProvider>` internally:

1. Restores the persisted preference from `localStorage` in its initial client render, and tracks an optimistic value for immediate feedback.
2. Subscribes to `(prefers-color-scheme: dark)` through `useSyncExternalStore` (server snapshot: `DEFAULT_RESOLVED_COLOR_SCHEME`).
3. Applies the resolved class + `color-scheme` to `<html>` whenever it changes.
4. Broadcasts the new value over `BroadcastChannel("color-scheme-sync")` so other tabs stay in sync.

### `useColorScheme()`

```tsx
const { colorScheme, resolvedColorScheme, setColorScheme, isPending } = useColorScheme();
```

| Field                 | Type                                    | Description                                                                          |
| --------------------- | --------------------------------------- | ------------------------------------------------------------------------------------ |
| `colorScheme`         | `ColorScheme`                           | Current preference (reflects the optimistic value while a change is pending).        |
| `resolvedColorScheme` | `ResolvedColorScheme`                   | `"light"` or `"dark"` — the value actually applied to `<html>`.                      |
| `setColorScheme`      | `(value: ColorScheme) => Promise<void>` | Update + persist. Resolves once persistence settles; on failure the UI reverts.      |
| `isPending`           | `boolean`                               | `true` while the optimistic value differs from the persisted one (change in flight). |

Throws if called outside of an `<AppearanceProvider>`.

### `<AppearanceScript>`

Inline script for the document head that prevents FOUC.

```tsx
<AppearanceScript nonce={cspNonce} />
```

| Prop          | Type          | Default       | Description                                                                                         |
| ------------- | ------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| `colorScheme` | `ColorScheme` | `"automatic"` | Fallback when the storage entry is absent or unrecognised. `"automatic"` resolves via `matchMedia`. |
| `storageKey`  | `string`      | `"ui-theme"`  | `localStorage` key the script reads before first paint. Use the same key as `<AppearanceProvider>`. |
| `nonce`       | `string`      | —             | Optional CSP nonce attached to the inline `<script>`.                                               |

The component emits a `<script>` with `dangerouslySetInnerHTML` and forwards `nonce` when provided.

### `resolveColorScheme()`

```tsx
import { resolveColorScheme } from "@codefast/theme";

resolveColorScheme("dark"); // → "dark"
resolveColorScheme("automatic"); // client: OS preference via matchMedia
```

Returns a `ResolvedColorScheme` (`"light" | "dark"`). On the server, `"automatic"` falls back to `DEFAULT_RESOLVED_COLOR_SCHEME` (`"dark"`).

### `getSystemColorScheme()` / `applyColorScheme()` / `suppressTransitions()`

Granular helpers from `@codefast/theme/utils/system` and `@codefast/theme/utils/dom` for custom integrations:

| Function                      | Summary                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `getSystemColorScheme()`      | Returns `"light"` or `"dark"` using `matchMedia("(prefers-color-scheme: dark)")`. SSR-safe.            |
| `applyColorScheme(resolved)`  | Toggles `light` / `dark` / `automatic` classes on `<html>` and sets `color-scheme`.                    |
| `suppressTransitions(nonce?)` | Returns a cleanup that re-enables CSS transitions. No-op when `prefers-reduced-motion: reduce` is set. |

### `colorSchemes`, `colorSchemeSchema`, and defaults

```tsx
import {
  DEFAULT_RESOLVED_COLOR_SCHEME, // "dark"
  DEFAULT_COLOR_SCHEME, // "automatic"
  colorSchemeSchema, // Zod: z.enum(["light", "dark", "automatic"])
  colorSchemes, // readonly ["light", "dark", "automatic"]
} from "@codefast/theme";

// STORAGE_KEY lives in the /constants subpath (intentionally not re-exported from root)
import { STORAGE_KEY } from "@codefast/theme/constants"; // "ui-theme"
```

---

## Package exports

The root `@codefast/theme` entry re-exports the common surface. Granular subpaths are available for bundler-aware tree-shaking.

| Subpath                               | Contents                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `@codefast/theme`                     | `AppearanceProvider`, `useColorScheme`, `AppearanceScript`, `resolveColorScheme`, types, `colorSchemes`, defaults |
| `@codefast/theme/core/provider`       | `AppearanceProvider`                                                                                              |
| `@codefast/theme/core/use-theme`      | `useColorScheme`                                                                                                  |
| `@codefast/theme/core/context`        | Raw `ColorSchemeContext` for custom providers                                                                     |
| `@codefast/theme/script/theme-script` | `AppearanceScript`                                                                                                |
| `@codefast/theme/utils/system`        | `getSystemColorScheme`, `resolveColorScheme`                                                                      |
| `@codefast/theme/utils/dom`           | `applyColorScheme`, `suppressTransitions`                                                                         |
| `@codefast/theme/constants`           | `DEFAULT_COLOR_SCHEME`, `DEFAULT_RESOLVED_COLOR_SCHEME`, `STORAGE_KEY`                                            |
| `@codefast/theme/types`               | `ColorScheme`, `ResolvedColorScheme`, `ColorSchemeContextType`, `colorSchemes`, `colorSchemeSchema`               |

See `package.json → exports` for the authoritative list.

---

## Contributing

This package lives in the [Codefast monorepo](https://github.com/codefastlabs/codefast). From the repo root:

```bash
pnpm --filter @codefast/theme build
pnpm --filter @codefast/theme test
pnpm --filter @codefast/theme check-types
pnpm --filter @codefast/theme dev     # watch-mode build
```

---

## License

[MIT](https://opensource.org/licenses/MIT) — see [`package.json`](./package.json).

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history. Releases are also published on [npm](https://www.npmjs.com/package/@codefast/theme?activeTab=versions).
