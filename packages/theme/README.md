# @codefast/theme

Color-scheme management for React 19 — SSR-safe `automatic` resolution, optimistic updates, cross-tab sync, and a drop-in TanStack Start adapter.

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
  - [Client-only React (localStorage)](#client-only-react-localstorage)
  - [Color scheme toggle](#color-scheme-toggle)
- [SSR and FOUC prevention](#ssr-and-fouc-prevention)
- [API Reference](#api-reference)
  - [`<AppearanceProvider>`](#appearanceprovider)
  - [`useColorScheme()`](#usecolorscheme)
  - [`<AppearanceScript>`](#appearancescript)
  - [`resolveColorScheme()`](#resolvecolorscheme)
  - [`getSystemColorScheme()` / `applyColorScheme()` / `suppressTransitions()`](#getsystemcolorscheme--applycolorscheme--suppresstransitions)
  - [`colorSchemes`, `colorSchemeSchema`, and defaults](#colorschemes-colorschemeschema-and-defaults)
  - [TanStack Start adapter (`@codefast/theme/start`)](#tanstack-start-adapter-codefastthemestart)
- [Package exports](#package-exports)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Why @codefast/theme

`@codefast/theme` is a focused color-scheme state primitive built around the React 19 concurrent APIs. Drop it at the root of your app, persist the user's preference however you want, and let the hook and inline script keep the DOM in sync.

- **React 19 first.** Uses `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent` to keep color scheme changes immediate, hydration-safe, and free of needless re-renders.
- **SSR-friendly.** A tiny inline `<AppearanceScript>` runs before first paint so `automatic` never flashes the wrong appearance. Works with Client Hints (`Sec-CH-Prefers-Color-Scheme`) when you have them.
- **Cross-tab sync.** Color scheme changes propagate between tabs over `BroadcastChannel`.
- **Optimistic setters.** `setColorScheme(value)` updates the UI immediately and reverts automatically if persistence fails.
- **TanStack Start adapter.** `@codefast/theme/start` ships cookie-based persistence plus loader/server helpers, and `@codefast/theme/vite` wires them into your build. Everything else stays vanilla.
- **Tree-shakeable.** Side-effect-free ESM with granular subpaths; bring in only the pieces you use.

---

## Requirements

- React `>=19.0.0` (and `react-dom`)
- TypeScript `>= 5.9` (recommended; the published types target ES2022)
- TanStack Start `^1` — only if you use `@codefast/theme/start`
- Vite `>=6` — only if you use `@codefast/theme/vite`

All peers except `react` / `react-dom` are optional.

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
pnpm add @tanstack/react-start   # only if using @codefast/theme/start
```

---

## Quick Start

```tsx
import { AppearanceProvider, useColorScheme } from "@codefast/theme";

function App() {
  return (
    <AppearanceProvider colorScheme="automatic">
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

`colorScheme` accepts `"light"`, `"dark"`, or `"automatic"`. `resolvedColorScheme` from `useColorScheme()` always narrows to `"light" | "dark"`.

---

## Recipes

### TanStack Start

Server-side persistence lives in `@codefast/theme/start`. The shell keeps full control over `<html>` / `<head>` / `<body>` — the adapter only provides the loader data and cookie helpers.

**Vite setup.** TanStack Start registers `@codefast/theme/start`'s server functions at build time, in your app's build. For that to happen the package must not be externalized for SSR nor pre-bundled for the client. The bundled `@codefast/theme/vite` plugin applies exactly that — so you don't hand-write `ssr.noExternal` / `optimizeDeps.exclude`:

```ts
// vite.config.ts
import { codefastTheme } from "@codefast/theme/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [codefastTheme(), tanstackStart(), viteReact()],
});
```

Then wire the root shell:

```tsx
// routes/__root.tsx (adjust to your router setup)
import { AppearanceProvider, AppearanceScript, resolveColorScheme } from "@codefast/theme";
import { getColorSchemeServerFn, getRootColorSchemeServerFn, persistColorSchemeCookie } from "@codefast/theme/start";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  loader: () => getRootColorSchemeServerFn(),
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { colorScheme, ssrColorScheme } = Route.useLoaderData();
  const resolved = resolveColorScheme(colorScheme, ssrColorScheme);

  return (
    <html className={resolved} lang="en" style={{ colorScheme: resolved }} suppressHydrationWarning>
      <head>
        <HeadContent />
        <AppearanceScript colorScheme={colorScheme} />
      </head>
      <body>
        <AppearanceProvider
          colorScheme={colorScheme}
          ssrColorScheme={ssrColorScheme}
          persistColorScheme={persistColorSchemeCookie}
          syncFromServer={getColorSchemeServerFn}
        >
          {children}
        </AppearanceProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

To keep cached HTML honest when serving `automatic`, advertise the Client Hint and add the right `Vary` header:

```
Accept-CH: Sec-CH-Prefers-Color-Scheme
Vary: Sec-CH-Prefers-Color-Scheme, Cookie
```

`syncFromServer` re-reads the cookie once after mount and covers edge cases like duplicate-tab restores where the HTML is older than the cookie.

### Client-only React (localStorage)

For apps without a server framework — or **statically prerendered / CDN-served** apps where the server can't inject the preference at request time — drive the whole thing from `localStorage`. Pass `storageKey` to both `<AppearanceScript>` and `<AppearanceProvider>`:

```tsx
import { AppearanceProvider, AppearanceScript } from "@codefast/theme";

const STORAGE_KEY = "color-scheme";

// In the document head — reads localStorage before first paint:
// <AppearanceScript colorScheme="automatic" storageKey={STORAGE_KEY} />

function App() {
  return (
    <AppearanceProvider colorScheme="automatic" storageKey={STORAGE_KEY}>
      <YourApp />
    </AppearanceProvider>
  );
}
```

With `storageKey`, the provider reads the preference from `localStorage` in its initial client render (so the first paint already matches it — no flash, no post-mount settle), auto-persists changes there (no hand-rolled `persistColorScheme`), and syncs across tabs via the `storage` event. The inline `<AppearanceScript>` applies the stored value to `<html>` **before first paint**, so there is no flash even on prerendered HTML — the real preference never has to round-trip a server after paint. Use the **same key** in both places.

> SSR has no `localStorage`, so the server renders the `colorScheme` prop. For a returning visitor whose stored preference differs, components that render preference-dependent markup hydrate-reconcile once; gate them behind a mounted flag if you need to avoid that.

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

`<AppearanceScript>` injects a tiny synchronous `<script>` into the document head. It runs before first paint, resolves `automatic` via `matchMedia`, and adds the appropriate class + `color-scheme` to `<html>`:

```tsx
<head>
  <AppearanceScript colorScheme="automatic" />
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

Root provider that wires together color scheme state, OS subscription, optimistic updates, and cross-tab broadcast.

```tsx
<AppearanceProvider
  colorScheme={initialColorScheme}
  ssrColorScheme="light"
  persistColorScheme={async (value) => {
    /* … */
  }}
  syncFromServer={getColorSchemeServerFn}
  disableTransition
  nonce={cspNonce}
>
  {children}
</AppearanceProvider>
```

| Prop                 | Type                                                          | Default | Description                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `colorScheme`        | `ColorScheme`                                                 | —       | Initial preference (`"light"` / `"dark"` / `"automatic"`). Required.                                                                                                                       |
| `ssrColorScheme`     | `ResolvedColorScheme`                                         | —       | `"light"` or `"dark"` from the SSR request (e.g. Client Hints). Used as the server snapshot when preference is `automatic`.                                                                |
| `persistColorScheme` | `(value: ColorScheme) => Promise<void>`                       | —       | Runs whenever the user changes the color scheme. Rejects → optimistic update reverts automatically.                                                                                        |
| `onPersistError`     | `(error: unknown, attemptedColorScheme: ColorScheme) => void` | —       | Optional hook called when `persistColorScheme` rejects; use for custom logging/telemetry/UI feedback.                                                                                      |
| `syncFromServer`     | `() => Promise<ColorScheme>`                                  | —       | Called once after mount to reconcile with the canonical source (e.g. cookie). Useful for stale HTML / duplicate-tab.                                                                       |
| `storageKey`         | `string`                                                      | —       | Client-only path: restore from `localStorage` after mount, auto-persist there, and sync across tabs via the `storage` event. Pair with `<AppearanceScript storageKey>` using the same key. |
| `disableTransition`  | `boolean`                                                     | `false` | Temporarily injects a style rule that disables CSS transitions while the color scheme swaps. Respects `prefers-reduced-motion`.                                                            |
| `nonce`              | `string`                                                      | —       | CSP nonce attached to the inline `<style>` element when `disableTransition` is enabled.                                                                                                    |
| `children`           | `ReactNode`                                                   | —       | Application content.                                                                                                                                                                       |

`<AppearanceProvider>` internally:

1. Tracks the persisted `colorScheme` and an optimistic value for immediate feedback.
2. Subscribes to `(prefers-color-scheme: dark)` through `useSyncExternalStore` with a server snapshot backed by `ssrColorScheme`.
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
<AppearanceScript colorScheme={colorScheme} nonce={cspNonce} />
```

| Prop          | Type          | Description                                                                                                                         |
| ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `colorScheme` | `ColorScheme` | The preference to apply on initial render. `"automatic"` resolves via `matchMedia`. Acts as fallback when `storageKey` is provided. |
| `nonce`       | `string`      | Optional CSP nonce attached to the inline `<script>`.                                                                               |
| `storageKey`  | `string`      | When set, the script reads `localStorage.getItem(storageKey)` before first paint. Use for client-only apps without an SSR cookie.   |

The component emits a `<script>` with `dangerouslySetInnerHTML` and forwards `nonce` when provided.

### `resolveColorScheme()`

```tsx
import { resolveColorScheme } from "@codefast/theme";

resolveColorScheme("dark"); // → "dark"
resolveColorScheme("automatic"); // client: OS preference via matchMedia
resolveColorScheme("automatic", "light"); // server: use Client Hints fallback
```

Returns a `ResolvedColorScheme` (`"light" | "dark"`). On the server without an `ssrColorScheme`, falls back to `DEFAULT_RESOLVED_COLOR_SCHEME` (`"dark"`).

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

### TanStack Start adapter (`@codefast/theme/start`)

Server functions and helpers for cookie-backed persistence. They run only on the server; the client calls them as RPC. Wire `@codefast/theme/vite` into your Vite config so they are registered (see [TanStack Start](#tanstack-start)).

| Export                       | Signature                                                           | Use                                                                  |
| ---------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `getRootColorSchemeServerFn` | `() => Promise<RootColorSchemeLoaderData>`                          | One call for the root loader: `{ colorScheme, ssrColorScheme }`.     |
| `getColorSchemeServerFn`     | `() => Promise<ColorScheme>`                                        | Re-read the cookie; pass as `AppearanceProvider`'s `syncFromServer`. |
| `getSsrColorSchemeServerFn`  | `() => Promise<ResolvedColorScheme>`                                | Resolved OS appearance from Client Hints only.                       |
| `setColorSchemeServerFn`     | `(opts: { data: ColorScheme }) => Promise<void>`                    | `POST` server fn (Zod-validated) that writes the httpOnly cookie.    |
| `persistColorSchemeCookie`   | `(value: ColorScheme) => Promise<void>`                             | Default `persistColorScheme` — wraps `setColorSchemeServerFn`.       |
| `RootColorSchemeLoaderData`  | `{ colorScheme: ColorScheme; ssrColorScheme: ResolvedColorScheme }` | Return type of `getRootColorSchemeServerFn`.                         |

---

## Package exports

The root `@codefast/theme` entry re-exports the common surface. Granular subpaths are available for bundler-aware tree-shaking.

| Subpath                                          | Contents                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `@codefast/theme`                                | `AppearanceProvider`, `useColorScheme`, `AppearanceScript`, `resolveColorScheme`, types, `colorSchemes`, defaults |
| `@codefast/theme/start`                          | TanStack Start server functions + `persistColorSchemeCookie`, `RootColorSchemeLoaderData`                         |
| `@codefast/theme/vite`                           | `codefastTheme` — Vite plugin so a TanStack Start app can consume `/start` from npm                               |
| `@codefast/theme/adapters/tanstack-start/server` | Same exports as `/start`, reached via the full adapter path                                                       |
| `@codefast/theme/core/provider`                  | `AppearanceProvider`                                                                                              |
| `@codefast/theme/core/use-theme`                 | `useColorScheme`                                                                                                  |
| `@codefast/theme/core/context`                   | Raw `ColorSchemeContext` for custom providers                                                                     |
| `@codefast/theme/script/theme-script`            | `AppearanceScript`                                                                                                |
| `@codefast/theme/utils/system`                   | `getSystemColorScheme`, `resolveColorScheme`                                                                      |
| `@codefast/theme/utils/dom`                      | `applyColorScheme`, `suppressTransitions`                                                                         |
| `@codefast/theme/constants`                      | `DEFAULT_COLOR_SCHEME`, `DEFAULT_RESOLVED_COLOR_SCHEME`, `STORAGE_KEY`                                            |
| `@codefast/theme/types`                          | `ColorScheme`, `ResolvedColorScheme`, `ColorSchemeContextType`, `colorSchemes`, `colorSchemeSchema`               |

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
