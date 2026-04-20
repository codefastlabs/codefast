# @codefast/theme

Theme management for React 19 — SSR-safe `system` resolution, optimistic updates, cross-tab sync, and a drop-in TanStack Start adapter.

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
  - [Theme toggle](#theme-toggle)
- [SSR and FOUC prevention](#ssr-and-fouc-prevention)
- [API Reference](#api-reference)
  - [`<ThemeProvider>`](#themeprovider)
  - [`useTheme()`](#usetheme)
  - [`<ThemeScript>`](#themescript)
  - [`resolveTheme()`](#resolvetheme)
  - [`getSystemTheme()` / `applyTheme()` / `disableAnimation()`](#getsystemtheme--applytheme--disableanimation)
  - [`themes`, `themeSchema`, and defaults](#themes-themeschema-and-defaults)
  - [TanStack Start adapter (`@codefast/theme/start`)](#tanstack-start-adapter-codefastthemestart)
- [Package exports](#package-exports)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Why @codefast/theme

`@codefast/theme` is a focused theme-state primitive built around the React 19 concurrent APIs. Drop it at the root of your app, persist the user's preference however you want, and let the hook and inline script keep the DOM in sync.

- **React 19 first.** Uses `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent` to keep theme changes immediate, hydration-safe, and free of needless re-renders.
- **SSR-friendly.** A tiny inline `<ThemeScript>` runs before first paint so `system` never flashes the wrong appearance. Works with Client Hints (`Sec-CH-Prefers-Color-Scheme`) when you have them.
- **Cross-tab sync.** Theme changes propagate between tabs over `BroadcastChannel`.
- **Optimistic setters.** `setTheme(value)` updates the UI immediately and reverts automatically if persistence fails.
- **TanStack Start adapter.** `@codefast/theme/start` ships cookie-based persistence plus loader/server helpers. Everything else stays vanilla.
- **Tree-shakeable.** Side-effect-free ESM with granular subpaths; bring in only the pieces you use.

---

## Requirements

- React `^19` (and `react-dom`)
- TypeScript `>= 5.9` (recommended; the published types target ES2022)
- TanStack Start `^1` — only if you use `@codefast/theme/start`

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
import { ThemeProvider, useTheme } from "@codefast/theme";

function App() {
  return (
    <ThemeProvider theme="system">
      <Page />
    </ThemeProvider>
  );
}

function Page() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Current theme: {theme}
    </button>
  );
}
```

`theme` accepts `"light"`, `"dark"`, or `"system"`. `resolvedTheme` from `useTheme()` always narrows to `"light" | "dark"`.

---

## Recipes

### TanStack Start

Server-side persistence lives in `@codefast/theme/start`. The shell keeps full control over `<html>` / `<head>` / `<body>` — the adapter only provides the loader data and cookie helpers.

```tsx
// routes/__root.tsx (adjust to your router setup)
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { getRootThemeServerFn, getThemeServerFn, persistThemeCookie } from "@codefast/theme/start";
import { ThemeProvider, ThemeScript, resolveTheme } from "@codefast/theme";

export const Route = createRootRouteWithContext<YourRouterContext>()({
  loader: async () => getRootThemeServerFn(),
  shellComponent: RootShell,
});

function RootShell({ children }: { children: React.ReactNode }) {
  const { theme, ssrSystemTheme } = Route.useLoaderData();
  const resolved = resolveTheme(theme, ssrSystemTheme);

  return (
    <html className={resolved} lang="en" style={{ colorScheme: resolved }} suppressHydrationWarning>
      <head>
        <HeadContent />
        <ThemeScript theme={theme} />
      </head>
      <body>
        <ThemeProvider
          theme={theme}
          ssrSystemTheme={ssrSystemTheme}
          persistTheme={persistThemeCookie}
          syncThemeFromServer={getThemeServerFn}
        >
          {children}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

To keep cached HTML honest when serving `system`, advertise the Client Hint and add the right `Vary` header:

```
Accept-CH: Sec-CH-Prefers-Color-Scheme
Vary: Sec-CH-Prefers-Color-Scheme, Cookie
```

`syncThemeFromServer` re-reads the cookie once after mount and covers edge cases like duplicate-tab restores where the HTML is older than the cookie.

### Client-only React (localStorage)

For apps without a server framework, persist the theme in `localStorage`:

```tsx
import { ThemeProvider } from "@codefast/theme";

function App() {
  const saved =
    typeof window !== "undefined" ? (localStorage.getItem("theme") ?? "system") : "system";

  return (
    <ThemeProvider
      theme={saved}
      persistTheme={async (value) => {
        localStorage.setItem("theme", value);
      }}
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

### Theme toggle

```tsx
import { themes, useTheme } from "@codefast/theme";

export function ThemeSelect() {
  const { theme, setTheme, isPending } = useTheme();

  return (
    <select
      value={theme}
      disabled={isPending}
      onChange={(event) => setTheme(event.target.value as (typeof themes)[number])}
    >
      {themes.map((value) => (
        <option key={value} value={value}>
          {value[0].toUpperCase() + value.slice(1)}
        </option>
      ))}
    </select>
  );
}
```

`isPending` is `true` while the optimistic value differs from the persisted value — useful for disabling the control until persistence settles.

---

## SSR and FOUC prevention

`<ThemeScript>` injects a tiny synchronous `<script>` into the document head. It runs before first paint, resolves `system` via `matchMedia`, and adds the appropriate class + `color-scheme` to `<html>`:

```tsx
<head>
  <ThemeScript theme="system" />
</head>
```

The script removes any prior `light` / `dark` / `system` class on `<html>`, so it is safe to pre-render the markup with `suppressHydrationWarning`.

> **CSP note.** `<ThemeScript>` currently does not accept a `nonce`. If your CSP forbids inline scripts, either add a specific hash for the generated snippet or serve the same logic from a hashed static file. The `disableTransitionOnChange` option on `<ThemeProvider>` _does_ accept a `nonce` because it injects inline `<style>`.

---

## API Reference

### `<ThemeProvider>`

Root provider that wires together theme state, OS subscription, optimistic updates, and cross-tab broadcast.

```tsx
<ThemeProvider
  theme={initialTheme}
  ssrSystemTheme="light"
  persistTheme={async (value) => {
    /* … */
  }}
  syncThemeFromServer={getThemeServerFn}
  disableTransitionOnChange
  nonce={cspNonce}
>
  {children}
</ThemeProvider>
```

| Prop                        | Type                              | Default | Description                                                                                                                    |
| --------------------------- | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `theme`                     | `Theme`                           | —       | Initial preference (`"light"` / `"dark"` / `"system"`). Required.                                                              |
| `ssrSystemTheme`            | `ResolvedTheme`                   | —       | `"light"` or `"dark"` from the SSR request (e.g. Client Hints). Used as the server snapshot when preference is `system`.       |
| `persistTheme`              | `(value: Theme) => Promise<void>` | —       | Runs whenever the user changes the theme. Rejects → optimistic update reverts automatically.                                   |
| `syncThemeFromServer`       | `() => Promise<Theme>`            | —       | Called once after mount to reconcile with the canonical source (e.g. cookie). Useful for stale HTML / duplicate-tab scenarios. |
| `disableTransitionOnChange` | `boolean`                         | `false` | Temporarily injects a style rule that disables CSS transitions while the theme swaps. Respects `prefers-reduced-motion`.       |
| `nonce`                     | `string`                          | —       | CSP nonce attached to the inline `<style>` element when `disableTransitionOnChange` is enabled.                                |
| `children`                  | `ReactNode`                       | —       | Application content.                                                                                                           |

`<ThemeProvider>` internally:

1. Tracks the persisted `theme` and an `optimisticTheme` for immediate feedback.
2. Subscribes to `(prefers-color-scheme: dark)` through `useSyncExternalStore` with a server snapshot backed by `ssrSystemTheme`.
3. Applies the resolved class + `color-scheme` to `<html>` whenever it changes.
4. Broadcasts the new value over `BroadcastChannel("theme-sync")` so other tabs stay in sync.

### `useTheme()`

```tsx
const { theme, resolvedTheme, setTheme, isPending } = useTheme();
```

| Field           | Type                              | Description                                                                     |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `theme`         | `Theme`                           | Current preference (reflects the optimistic value while a change is pending).   |
| `resolvedTheme` | `ResolvedTheme`                   | `"light"` or `"dark"` — the value actually applied to `<html>`.                 |
| `setTheme`      | `(value: Theme) => Promise<void>` | Update + persist. Resolves once persistence settles; on failure the UI reverts. |
| `isPending`     | `boolean`                         | `true` while `optimisticTheme !== theme` (i.e. a change is in flight).          |

Throws if called outside of a `<ThemeProvider>`.

### `<ThemeScript>`

Inline script for the document head that prevents FOUC.

```tsx
<ThemeScript theme={theme} />
```

| Prop    | Type    | Description                                                                      |
| ------- | ------- | -------------------------------------------------------------------------------- |
| `theme` | `Theme` | The preference to apply on initial render. `"system"` resolves via `matchMedia`. |

The component only emits a `<script>` with `dangerouslySetInnerHTML`. It does not currently accept a `nonce` — see the [CSP note](#ssr-and-fouc-prevention).

### `resolveTheme()`

```tsx
import { resolveTheme } from "@codefast/theme";

resolveTheme("dark"); // → "dark"
resolveTheme("system"); // client: OS preference via matchMedia
resolveTheme("system", "light"); // server: use Client Hints fallback
```

Returns a `ResolvedTheme` (`"light" | "dark"`). On the server without an `ssrSystemTheme`, falls back to `DEFAULT_RESOLVED_THEME` (`"dark"`).

### `getSystemTheme()` / `applyTheme()` / `disableAnimation()`

Granular helpers from `@codefast/theme/utils/system` and `@codefast/theme/utils/dom` for custom integrations:

| Function                   | Summary                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| `getSystemTheme()`         | Returns `"light"` or `"dark"` using `matchMedia("(prefers-color-scheme: dark)")`. SSR-safe.            |
| `applyTheme(resolved)`     | Toggles `light` / `dark` / `system` classes on `<html>` and sets `color-scheme`.                       |
| `disableAnimation(nonce?)` | Returns a cleanup that re-enables CSS transitions. No-op when `prefers-reduced-motion: reduce` is set. |

### `themes`, `themeSchema`, and defaults

```tsx
import {
  DEFAULT_RESOLVED_THEME, // "dark"
  DEFAULT_THEME, // "system"
  THEME_STORAGE_KEY, // "ui-theme" — cookie name used by the Start adapter
  themeSchema, // Zod: z.enum(["light", "dark", "system"])
  themes, // readonly ["light", "dark", "system"]
} from "@codefast/theme";
```

### TanStack Start adapter (`@codefast/theme/start`)

Server functions and helpers for cookie-backed persistence. All helpers are safe to import from both server and client module graphs — but only run from the appropriate context.

| Export                      | Kind      | Purpose                                                                                                 |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `getRootThemeServerFn`      | Server fn | Reads `{ theme, ssrSystemTheme }` from cookie + Client Hints. Use in your root route loader.            |
| `getThemeServerFn`          | Server fn | Reads only the stored theme. Stable reference — pass directly to `<ThemeProvider syncThemeFromServer>`. |
| `getSsrSystemThemeServerFn` | Server fn | Reads only the SSR system hint (Client-Hint value).                                                     |
| `setThemeServerFn`          | Server fn | Writes the theme cookie from a server action.                                                           |
| `persistThemeCookie`        | Helper    | Drop-in `persistTheme` prop for `<ThemeProvider>`; wraps `setThemeServerFn`.                            |
| `RootThemeLoaderData`       | Type      | Shape of the loader payload returned by `getRootThemeServerFn`.                                         |

---

## Package exports

The root `@codefast/theme` entry re-exports the common surface. Granular subpaths are available for bundler-aware tree-shaking.

| Subpath                                          | Contents                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `@codefast/theme`                                | `ThemeProvider`, `useTheme`, `ThemeScript`, `resolveTheme`, types, `themes`, defaults |
| `@codefast/theme/start`                          | TanStack Start server functions + `persistThemeCookie`, `RootThemeLoaderData`         |
| `@codefast/theme/adapters/tanstack-start/server` | Same exports as `/start`, reached via the full adapter path                           |
| `@codefast/theme/core/provider`                  | `ThemeProvider`                                                                       |
| `@codefast/theme/core/use-theme`                 | `useTheme`                                                                            |
| `@codefast/theme/core/context`                   | Raw `ThemeContext` for custom providers                                               |
| `@codefast/theme/script/theme-script`            | `ThemeScript`                                                                         |
| `@codefast/theme/utils/system`                   | `getSystemTheme`, `resolveTheme`                                                      |
| `@codefast/theme/utils/dom`                      | `applyTheme`, `disableAnimation`                                                      |
| `@codefast/theme/constants`                      | `DEFAULT_THEME`, `DEFAULT_RESOLVED_THEME`, `THEME_STORAGE_KEY`                        |
| `@codefast/theme/types`                          | `Theme`, `ResolvedTheme`, `ThemeContextType`, `themes`, `themeSchema`                 |

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
