# @codefast/theme

Appearance management for React 19 — optimistic updates, cross-tab sync, and FOUC-free SSR, with vocabulary borrowed from Apple's Human Interface Guidelines.

[![npm version](https://img.shields.io/npm/v/@codefast/theme)](https://www.npmjs.com/package/@codefast/theme)
[![license](https://img.shields.io/npm/l/@codefast/theme)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

Two words, two meanings, kept apart throughout the API:

| Term          | Type                               | Meaning                                                                         |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `Appearance`  | `"light" \| "dark" \| "automatic"` | The user's preference — think macOS System Settings: Light / Dark / Auto.       |
| `ColorScheme` | `"light" \| "dark"`                | The resolved value actually applied to the page, after `automatic` is resolved. |

The preference lives entirely on the client in `localStorage` — no cookies, loaders, or server functions. Built on React 19's `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent`.

## Installation

```bash
pnpm add @codefast/theme
# npm install @codefast/theme
# yarn add @codefast/theme
```

Requires `react` and `react-dom` version 19 or later as peer dependencies. Published as `1.0.0-canary.*` pre-releases on the way to a stable 1.0.

## Quick Start

Wrap your app in the provider, then read and set the appearance from any component:

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
  const { appearance, colorScheme, setAppearance, isPending } = useAppearance();

  return (
    <button disabled={isPending} onClick={() => setAppearance(appearance === "dark" ? "light" : "dark")}>
      Preference: {appearance} — showing: {colorScheme}
    </button>
  );
}
```

`setAppearance` updates the UI immediately (optimistic), persists to `localStorage`, and reverts automatically if persistence fails. The resolved color scheme is applied to `<html>` as a `light` / `dark` class plus the CSS `color-scheme` property, so Tailwind `dark:` variants and native controls both follow along.

A three-state selector needs no hard-coded list — `appearances` is `["light", "dark", "automatic"]`:

```tsx
import { appearances, useAppearance } from "@codefast/theme";

function AppearanceSelect() {
  const { appearance, setAppearance, isPending } = useAppearance();

  return (
    <select
      disabled={isPending}
      value={appearance}
      onChange={(event) => setAppearance(event.target.value as (typeof appearances)[number])}
    >
      {appearances.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}
```

## FOUC-free SSR

React hydrates after first paint, so server-rendered HTML alone would flash the wrong colors for returning visitors. `<AppearanceScript>` fixes this: a tiny inline script in `<head>` that reads `localStorage`, resolves `automatic` via `matchMedia`, and applies the correct class before anything paints — including on statically prerendered, CDN-served pages.

A TanStack Start root shell (works the same in any framework that lets you render into the document head):

```tsx
import { AppearanceProvider, AppearanceScript, DEFAULT_APPEARANCE, DEFAULT_COLOR_SCHEME } from "@codefast/theme";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createRootRoute({ shellComponent: RootDocument });

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={DEFAULT_COLOR_SCHEME}
      // "light dark": the pre-paint frame follows the OS instead of flashing a
      // hardcoded color; AppearanceScript sets the resolved value before paint.
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

The server renders the defaults; the script corrects `<html>` before first paint and `suppressHydrationWarning` absorbs the mismatch. The script also mirrors the preference (not the resolved value) to a `data-appearance` attribute, so preference-aware UI can render correctly from pure CSS on the very first frame:

```css
/* highlight the "Auto" option when the stored preference is automatic */
html[data-appearance="automatic"] .option-auto {
  background: var(--active);
}
```

If your Content Security Policy requires nonces for inline scripts, pass one: `<AppearanceScript nonce={cspNonce} />`. The same prop exists on `<AppearanceProvider>` for the temporary inline style used by `disableTransition`.

## Cross-tab sync

Appearance changes propagate to every open tab: the provider broadcasts over a `BroadcastChannel` and falls back to the `storage` event where the channel is unavailable. Incoming messages are schema-validated before being applied, and each tab re-resolves `automatic` against its own OS preference. No configuration needed — it works out of the box with the default `localStorage` persistence.

## API

Everything below ships from the root entry unless a subpath is noted.

| Export                                                                       | Kind      | Summary                                                                                       |
| ---------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `AppearanceProvider`                                                         | component | Owns appearance state: persistence, OS subscription, optimistic updates, cross-tab sync.      |
| `useAppearance()`                                                            | hook      | Returns `{ appearance, colorScheme, setAppearance, isPending }`; throws outside the provider. |
| `AppearanceScript`                                                           | component | Inline head script that applies the stored preference before first paint.                     |
| `resolveColorScheme(appearance)`                                             | function  | Resolves an `Appearance` to a `ColorScheme`; `automatic` uses `matchMedia` on the client.     |
| `appearances`                                                                | constant  | `["light", "dark", "automatic"]` — handy for rendering selectors.                             |
| `appearanceSchema`                                                           | schema    | Zod enum validating appearance values.                                                        |
| `DEFAULT_APPEARANCE`                                                         | constant  | `"automatic"` — fallback preference.                                                          |
| `DEFAULT_COLOR_SCHEME`                                                       | constant  | `"dark"` — fallback when `matchMedia` is unavailable (SSR).                                   |
| `Appearance`, `ColorScheme`                                                  | types     | The preference and resolved-value unions.                                                     |
| `AppearanceProviderProps`, `AppearanceScriptProps`, `AppearanceContextValue` | types     | Prop and context shapes.                                                                      |
| `STORAGE_KEY` (`@codefast/theme/constants`)                                  | constant  | `"ui-appearance"` — the default `localStorage` key.                                           |
| `getSystemColorScheme()` (`@codefast/theme/color-scheme`)                    | function  | Reads the OS preference via `matchMedia`; SSR-safe.                                           |
| `applyColorScheme()`, `suppressTransitions()` (`@codefast/theme/dom`)        | functions | DOM helpers for custom integrations.                                                          |
| `AppearanceContext` (`@codefast/theme/appearance-context`)                   | context   | Raw context for custom providers.                                                             |

Granular subpaths (`./appearance`, `./appearance-provider`, `./use-appearance`, ...) mirror the source modules for bundler-aware imports — see the `exports` field in `package.json` for the full list.

### AppearanceProvider props

| Prop                | Default           | Description                                                                                   |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `appearance`        | `"automatic"`     | Fallback preference when storage has no valid entry; also what SSR renders.                   |
| `storageKey`        | `"ui-appearance"` | `localStorage` key — must match the one passed to `<AppearanceScript>`.                       |
| `persistAppearance` | —                 | Custom async persistence replacing the `localStorage` auto-persist; rejection reverts the UI. |
| `onPersistError`    | —                 | Called with `(error, attemptedAppearance)` when `persistAppearance` rejects.                  |
| `disableTransition` | `false`           | Suppress CSS transitions while the color scheme swaps; respects `prefers-reduced-motion`.     |
| `nonce`             | —                 | CSP nonce for the inline style injected by `disableTransition`.                               |

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE)
