# @codefast/theme

Theme management for React 19 applications with optimistic updates, cross-tab synchronization, and SSR support.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/theme.svg)](https://www.npmjs.com/package/@codefast/theme)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/theme.svg)](https://www.npmjs.com/package/@codefast/theme)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@codefast/theme)](https://bundlephobia.com/package/@codefast/theme)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [TanStack Start](#tanstack-start)
  - [Generic React (Client-Side)](#generic-react-client-side)
  - [Theme Toggle Component](#theme-toggle-component)
- [SSR and FOUC Prevention](#ssr-and-fouc-prevention)
- [API Reference](#api-reference)
  - [ThemeProvider](#themeprovider)
  - [useTheme](#usetheme)
  - [ThemeScript](#themescript)
  - [resolveTheme](#resolvetheme)
  - [themes](#themes)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

## Overview

`@codefast/theme` provides a complete theme management solution built specifically for React 19. It leverages modern React APIs for the best possible user experience.

**Key features:**

- **React 19 Optimized** -- Uses `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent` for seamless transitions.
- **System Theme Detection** -- Automatically detects and follows the operating system preference.
- **Cross-tab Sync** -- Theme changes propagate instantly across all open browser tabs.
- **Optimistic Updates** -- Immediate UI feedback during asynchronous theme persistence.
- **SSR Ready** -- Inline script prevents flash of unstyled content (FOUC) on server-rendered pages.
- **TanStack Start** -- `@codefast/theme/start` bundles cookie persistence and loader helpers.

## Public entry points

| Import                      | Contents                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `@codefast/theme`           | `ThemeProvider`, `useTheme`, `ThemeScript`, `resolveTheme`, types, `themes`, defaults                                                    |
| `@codefast/theme/start`     | `getRootThemeServerFn`, `getThemeServerFn`, `getSsrSystemThemeServerFn`, `setThemeServerFn`, `persistThemeCookie`, `RootThemeLoaderData` |
| `@codefast/theme/utils`     | `getSystemTheme`, `applyTheme`, `disableAnimation`, `resolveTheme`                                                                       |
| `@codefast/theme/core`      | `ThemeContext`, `ThemeProvider`, `useTheme`                                                                                              |
| `@codefast/theme/script`    | `ThemeScript`                                                                                                                            |
| `@codefast/theme/constants` | `DEFAULT_THEME`, `DEFAULT_RESOLVED_THEME`, `THEME_STORAGE_KEY`, …                                                                        |
| `@codefast/theme/types`     | `themeSchema`, types                                                                                                                     |

## Installation

```bash
pnpm add @codefast/theme
```

Or using npm:

```bash
npm install @codefast/theme
```

**Peer dependencies:**

```bash
pnpm add react react-dom
```

**Optional peer dependencies (for TanStack Start):**

```bash
pnpm add @tanstack/react-start
```

**Requirements:**

- Node.js >= 24.0.0 (LTS)
- React >= 19.0.0
- TypeScript >= 5.9.2 (recommended)

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

## Usage

### TanStack Start

Server persistence and loader data live in `@codefast/theme/start`. Your shell keeps full control of `<html>` / `<head>` / `<body>`.

```tsx
// routes/__root.tsx (pattern; adjust to your router setup)
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { getRootThemeServerFn, getThemeServerFn, persistThemeCookie } from "@codefast/theme/start";
import { ThemeProvider, ThemeScript, resolveTheme } from "@codefast/theme";

export const Route = createRootRouteWithContext<YourContext>()({
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

Send `Accept-CH: Sec-CH-Prefers-Color-Scheme` and include both that header and `Cookie` in response `Vary` so cached HTML is not reused with the wrong theme. `syncThemeFromServer` covers remaining stale-document edge cases (e.g. duplicate tab).

### Generic React (Client-Side)

For client-side React applications without a server framework, persist the theme to `localStorage`:

```tsx
import { ThemeProvider } from "@codefast/theme";

function App() {
  const savedTheme = localStorage.getItem("theme") ?? "system";

  return (
    <ThemeProvider
      theme={savedTheme}
      persistTheme={async (value) => {
        localStorage.setItem("theme", value);
      }}
    >
      <YourApp />
    </ThemeProvider>
  );
}
```

### Theme Toggle Component

Build a theme switcher using the `useTheme` hook and the `themes` constant:

```tsx
import { useTheme, themes } from "@codefast/theme";

function ThemeToggle() {
  const { theme, setTheme, isPending } = useTheme();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)} disabled={isPending}>
      {themes.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  );
}
```

## SSR and FOUC Prevention

When server-rendering your application, include `ThemeScript` in the `<head>` to prevent a flash of unstyled content. The script runs synchronously before the page paints, applying the correct theme class to the `<html>` element.

```tsx
import { ThemeScript } from "@codefast/theme";

// In your HTML head (framework-specific)
<ThemeScript theme="system" />;
```

For Content Security Policy (CSP) environments, pass a `nonce` to both `ThemeScript` and `ThemeProvider`:

```tsx
<ThemeScript theme="system" nonce={cspNonce} />
<ThemeProvider theme="system" nonce={cspNonce}>
  <App />
</ThemeProvider>
```

## API Reference

### ThemeProvider

Root provider component that manages theme state and context.

```tsx
<ThemeProvider
  theme="system"
  persistTheme={async (value) => {
    /* save theme */
  }}
  disableTransitionOnChange={false}
  nonce="abc123"
>
  {children}
</ThemeProvider>
```

| Prop                        | Type                              | Default | Description                                                                                                                                      |
| --------------------------- | --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `theme`                     | `Theme`                           | --      | Initial theme value (`'light'`, `'dark'`, or `'system'`)                                                                                         |
| `ssrSystemTheme`            | `ResolvedTheme`                   | --      | Optional `light`/`dark` from SSR (e.g. Client Hints) so `system` hydrates without flipping                                                       |
| `syncThemeFromServer`       | `() => Promise<Theme>`            | --      | Once after mount, re-read cookie/source of truth (fixes stale cached HTML on duplicate tab). Use `getThemeServerFn` from `@codefast/theme/start` |
| `persistTheme`              | `(value: Theme) => Promise<void>` | --      | Callback invoked when the user changes the theme                                                                                                 |
| `disableTransitionOnChange` | `boolean`                         | `false` | Disable CSS transitions during theme changes to avoid visual flicker                                                                             |
| `nonce`                     | `string`                          | --      | CSP nonce for inline `<style>` elements                                                                                                          |
| `children`                  | `React.ReactNode`                 | --      | Application content                                                                                                                              |

### useTheme

Hook that returns the current theme state and a setter function.

```tsx
const { theme, resolvedTheme, setTheme, isPending } = useTheme();
```

| Property        | Type                              | Description                                                               |
| --------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `theme`         | `Theme`                           | Current theme preference (`'light'`, `'dark'`, or `'system'`)             |
| `resolvedTheme` | `ResolvedTheme`                   | Resolved theme after evaluating system preference (`'light'` or `'dark'`) |
| `setTheme`      | `(value: Theme) => Promise<void>` | Function to update the theme                                              |
| `isPending`     | `boolean`                         | `true` while an optimistic theme update is in progress                    |

### ThemeScript

Inline script component for SSR that prevents FOUC by applying the theme before first paint.

```tsx
<ThemeScript theme="system" nonce="optional-csp-nonce" />
```

| Prop    | Type     | Description                        |
| ------- | -------- | ---------------------------------- |
| `theme` | `Theme`  | The theme to apply on initial load |
| `nonce` | `string` | Optional CSP nonce                 |

### resolveTheme

Utility function that resolves a theme value to either `'light'` or `'dark'`.

```typescript
import { resolveTheme } from "@codefast/theme";

const resolved = resolveTheme("system"); // client: OS via matchMedia
const ssr = resolveTheme("system", "light"); // server: pass Client-Hint–backed value
```

### themes

A constant array containing all available theme values.

```typescript
import { themes } from "@codefast/theme";

console.log(themes); // ['light', 'dark', 'system']
```

## Contributing

We welcome contributions! Please see the [contributing guide](../../README.md#contributing) in the root of this repository for detailed instructions on how to get started.

For package-specific development:

```bash
# Development mode with watch
pnpm dev --filter=@codefast/theme

# Run tests
pnpm test --filter=@codefast/theme

# Run tests with coverage
pnpm test:coverage --filter=@codefast/theme
```

Package build/dev scripts use TypeScript directly via `tsc -p tsconfig.build.json` (watch mode for `pnpm dev --filter=@codefast/theme`).

## License

Distributed under the MIT License. See [LICENSE](../../LICENSE) for more details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a complete list of changes and version history.
