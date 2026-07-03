# @codefast/theme

Appearance management for React 19, with vocabulary borrowed from Apple's Human Interface Guidelines: **appearance** is the user's preference (Light / Dark / Auto), **color scheme** is the resolved light-or-dark value actually applied. `localStorage` persistence, FOUC-free first paint, SSR-safe `automatic` resolution, optimistic updates, and cross-tab sync.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/theme.svg)](https://www.npmjs.com/package/@codefast/theme)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/theme.svg)](https://www.npmjs.com/package/@codefast/theme)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/theme)](https://bundlephobia.com/package/@codefast/theme)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [Why @codefast/theme](#why-codefasttheme)
- [Vocabulary](#vocabulary)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Recipes](#recipes)
  - [TanStack Start](#tanstack-start)
  - [Appearance toggle](#appearance-toggle)
- [SSR and FOUC prevention](#ssr-and-fouc-prevention)
- [API Reference](#api-reference)
  - [`<AppearanceProvider>`](#appearanceprovider)
  - [`useAppearance()`](#useappearance)
  - [`<AppearanceScript>`](#appearancescript)
  - [`resolveColorScheme()`](#resolvecolorscheme)
  - [`getSystemColorScheme()` / `applyColorScheme()` / `suppressTransitions()`](#getsystemcolorscheme--applycolorscheme--suppresstransitions)
  - [`appearances`, `appearanceSchema`, and defaults](#appearances-appearanceschema-and-defaults)
- [Package exports](#package-exports)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Why @codefast/theme

`@codefast/theme` is a focused appearance state primitive built around the React 19 concurrent APIs. Drop it at the root of your app and let the hook and inline script keep the DOM in sync — the preference lives entirely on the client, in `localStorage`, so no server round-trip is ever needed.

- **React 19 first.** Uses `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent` to keep appearance changes immediate, hydration-safe, and free of needless re-renders.
- **No flash, anywhere.** A tiny inline `<AppearanceScript>` reads `localStorage` and applies the right class before first paint — including on statically prerendered / CDN-served HTML.
- **Zero server wiring.** No cookies, loaders, or server functions. Works the same in any React framework, SSR or not.
- **Cross-tab sync.** Appearance changes propagate between tabs over `BroadcastChannel`, with the `storage` event as fallback.
- **Optimistic setters.** `setAppearance(value)` updates the UI immediately and reverts automatically if persistence fails.
- **Tree-shakeable.** Side-effect-free ESM with granular subpaths; bring in only the pieces you use.

---

## Vocabulary

The API follows Apple's Human Interface Guidelines, which map cleanly onto the web platform:

| Term          | Type                               | Meaning                                                                                                    |
| ------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Appearance`  | `"light" \| "dark" \| "automatic"` | The user's _preference_ — macOS System Settings → Appearance: Light / Dark / Auto.                         |
| `ColorScheme` | `"light" \| "dark"`                | The _resolved_ value actually applied — SwiftUI `ColorScheme`, CSS `color-scheme`, `prefers-color-scheme`. |

`useAppearance()` exposes both: `appearance` (what the user picked) and `colorScheme` (what the page shows).

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
import { AppearanceProvider, useAppearance } from "@codefast/theme";

function App() {
  return (
    <AppearanceProvider>
      <Page />
    </AppearanceProvider>
  );
}

function Page() {
  const { appearance, setAppearance } = useAppearance();

  return (
    <button onClick={() => setAppearance(appearance === "dark" ? "light" : "dark")}>
      Current appearance: {appearance}
    </button>
  );
}
```

`appearance` accepts `"light"`, `"dark"`, or `"automatic"`. `colorScheme` from `useAppearance()` always narrows to `"light" | "dark"`. The preference is persisted in `localStorage` under `STORAGE_KEY` (`"ui-theme"`) by default; pass a custom `storageKey` to both `<AppearanceScript>` and `<AppearanceProvider>` to change it.

---

## Recipes

### TanStack Start

The shell keeps full control over `<html>` / `<head>` / `<body>`. Server-rendered HTML can't know the preference at request time, so render the defaults and let `<AppearanceScript>` correct the class before paint — `suppressHydrationWarning` absorbs the mismatch. No loader, no server function:

```tsx
// routes/__root.tsx (adjust to your router setup)
import { AppearanceProvider, AppearanceScript, DEFAULT_APPEARANCE, DEFAULT_COLOR_SCHEME } from "@codefast/theme";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={DEFAULT_COLOR_SCHEME}
      lang="en"
      // "light dark": the pre-paint blank frame follows the OS instead of flashing a hardcoded
      // color on reload; AppearanceScript overwrites this with the resolved value before paint.
      style={{ colorScheme: "light dark" }}
      data-appearance={DEFAULT_APPEARANCE}
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

> SSR has no `localStorage`, so the server renders the `appearance` prop (default `"automatic"`). For a returning visitor whose stored preference differs, components that render preference-dependent markup hydrate-reconcile once; gate them behind a mounted flag if you need to avoid that.

### Appearance toggle

```tsx
import { appearances, useAppearance } from "@codefast/theme";

export function AppearanceSelect() {
  const { appearance, setAppearance, isPending } = useAppearance();

  return (
    <select
      value={appearance}
      disabled={isPending}
      onChange={(event) => setAppearance(event.target.value as (typeof appearances)[number])}
    >
      {appearances.map((value) => (
        <option key={value} value={value}>
          {value[0].toUpperCase() + value.slice(1)}
        </option>
      ))}
    </select>
  );
}
```

`appearances` is `["light", "dark", "automatic"]`, so this renders every option without hard-coding the list.

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

Root provider that wires together appearance state, `localStorage` persistence, OS subscription, optimistic updates, and cross-tab broadcast.

```tsx
<AppearanceProvider disableTransition nonce={cspNonce}>
  {children}
</AppearanceProvider>
```

| Prop                | Type                                                        | Default       | Description                                                                                                                                     |
| ------------------- | ----------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `appearance`        | `Appearance`                                                | `"automatic"` | Fallback preference when storage has no valid entry; also what SSR renders.                                                                     |
| `storageKey`        | `string`                                                    | `"ui-theme"`  | `localStorage` key to restore from, auto-persist under, and sync across tabs via the `storage` event. Use the same key as `<AppearanceScript>`. |
| `persistAppearance` | `(value: Appearance) => Promise<void>`                      | —             | Custom persistence; replaces the `localStorage` auto-persist. Rejects → optimistic update reverts automatically.                                |
| `onPersistError`    | `(error: unknown, attemptedAppearance: Appearance) => void` | —             | Optional hook called when `persistAppearance` rejects; use for custom logging/telemetry/UI feedback.                                            |
| `disableTransition` | `boolean`                                                   | `false`       | Temporarily injects a style rule that disables CSS transitions while the color scheme swaps. Respects `prefers-reduced-motion`.                 |
| `nonce`             | `string`                                                    | —             | CSP nonce attached to the inline `<style>` element when `disableTransition` is enabled.                                                         |
| `children`          | `ReactNode`                                                 | —             | Application content.                                                                                                                            |

`<AppearanceProvider>` internally:

1. Restores the persisted preference from `localStorage` in its initial client render, and tracks an optimistic value for immediate feedback.
2. Subscribes to `(prefers-color-scheme: dark)` through `useSyncExternalStore` (server snapshot: `DEFAULT_COLOR_SCHEME`).
3. Applies the resolved class + `color-scheme` to `<html>` whenever it changes.
4. Broadcasts the new value over `BroadcastChannel("color-scheme-sync")` so other tabs stay in sync.

### `useAppearance()`

```tsx
const { appearance, colorScheme, setAppearance, isPending } = useAppearance();
```

| Field           | Type                                   | Description                                                                          |
| --------------- | -------------------------------------- | ------------------------------------------------------------------------------------ |
| `appearance`    | `Appearance`                           | Current preference (reflects the optimistic value while a change is pending).        |
| `colorScheme`   | `ColorScheme`                          | `"light"` or `"dark"` — the value actually applied to `<html>`.                      |
| `setAppearance` | `(value: Appearance) => Promise<void>` | Update + persist. Resolves once persistence settles; on failure the UI reverts.      |
| `isPending`     | `boolean`                              | `true` while the optimistic value differs from the persisted one (change in flight). |

Throws if called outside of an `<AppearanceProvider>`.

### `<AppearanceScript>`

Inline script for the document head that prevents FOUC.

```tsx
<AppearanceScript nonce={cspNonce} />
```

| Prop         | Type         | Default       | Description                                                                                         |
| ------------ | ------------ | ------------- | --------------------------------------------------------------------------------------------------- |
| `appearance` | `Appearance` | `"automatic"` | Fallback when the storage entry is absent or unrecognised. `"automatic"` resolves via `matchMedia`. |
| `storageKey` | `string`     | `"ui-theme"`  | `localStorage` key the script reads before first paint. Use the same key as `<AppearanceProvider>`. |
| `nonce`      | `string`     | —             | Optional CSP nonce attached to the inline `<script>`.                                               |

The component emits a `<script>` with `dangerouslySetInnerHTML` and forwards `nonce` when provided.

### `resolveColorScheme()`

```tsx
import { resolveColorScheme } from "@codefast/theme";

resolveColorScheme("dark"); // → "dark"
resolveColorScheme("automatic"); // client: OS preference via matchMedia
```

Resolves an `Appearance` to the `ColorScheme` to apply (`"light" | "dark"`). On the server, `"automatic"` falls back to `DEFAULT_COLOR_SCHEME` (`"dark"`).

### `getSystemColorScheme()` / `applyColorScheme()` / `suppressTransitions()`

Granular helpers from `@codefast/theme/color-scheme` and `@codefast/theme/dom` for custom integrations:

| Function                        | Summary                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `getSystemColorScheme()`        | Returns `"light"` or `"dark"` using `matchMedia("(prefers-color-scheme: dark)")`. SSR-safe.            |
| `applyColorScheme(colorScheme)` | Toggles `light` / `dark` / `automatic` classes on `<html>` and sets `color-scheme`.                    |
| `suppressTransitions(nonce?)`   | Returns a cleanup that re-enables CSS transitions. No-op when `prefers-reduced-motion: reduce` is set. |

### `appearances`, `appearanceSchema`, and defaults

```tsx
import {
  DEFAULT_APPEARANCE, // "automatic"
  DEFAULT_COLOR_SCHEME, // "dark"
  appearanceSchema, // Zod: z.enum(["light", "dark", "automatic"])
  appearances, // readonly ["light", "dark", "automatic"]
} from "@codefast/theme";

// STORAGE_KEY lives in the /constants subpath (intentionally not re-exported from root)
import { STORAGE_KEY } from "@codefast/theme/constants"; // "ui-theme"
```

---

## Package exports

The root `@codefast/theme` entry re-exports the common surface. Granular subpaths are available for bundler-aware tree-shaking.

| Subpath                               | Contents                                                                                         |
| ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `@codefast/theme`                     | `AppearanceProvider`, `useAppearance`, `AppearanceScript`, `resolveColorScheme`, types, defaults |
| `@codefast/theme/appearance`          | `Appearance`, `ColorScheme`, `AppearanceContextType`, `appearances`, `appearanceSchema`          |
| `@codefast/theme/appearance-provider` | `AppearanceProvider`                                                                             |
| `@codefast/theme/appearance-script`   | `AppearanceScript`                                                                               |
| `@codefast/theme/appearance-context`  | Raw `AppearanceContext` for custom providers                                                     |
| `@codefast/theme/use-appearance`      | `useAppearance`                                                                                  |
| `@codefast/theme/color-scheme`        | `getSystemColorScheme`, `resolveColorScheme`                                                     |
| `@codefast/theme/dom`                 | `applyColorScheme`, `suppressTransitions`                                                        |
| `@codefast/theme/constants`           | `DEFAULT_APPEARANCE`, `DEFAULT_COLOR_SCHEME`, `STORAGE_KEY`                                      |

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
