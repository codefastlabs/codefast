# @codefast/theme

Appearance management for React 19 apps — a light / dark / automatic preference with optimistic updates, cross-tab sync,
and a FOUC-free server render.

[![npm version](https://img.shields.io/npm/v/@codefast/theme)](https://www.npmjs.com/package/@codefast/theme)
[![license](https://img.shields.io/npm/l/@codefast/theme)](./LICENSE)

- **Two words, kept apart.** The vocabulary follows Apple's Human Interface Guidelines: the _appearance_ is what the
  user chose, the _color scheme_ is what the page shows.
- **Client-only persistence.** The preference lives in `localStorage` — no cookies, loaders, or server functions, so it
  works on statically prerendered, CDN-served pages.
- **No flash on first paint.** `<AppearanceScript>` applies the stored preference from `<head>` before the browser
  paints.
- **React 19 primitives.** Built on `useOptimistic`, `useSyncExternalStore`, and `useEffectEvent`; the setter is
  optimistic and every tab follows along.
- **Tailwind-ready.** The resolved color scheme lands on `<html>` as a `light` / `dark` class plus the CSS
  `color-scheme` property, so `dark:` variants and native controls both follow.

## Installation

```bash
pnpm add @codefast/theme
# npm install @codefast/theme
# yarn add @codefast/theme
```

`react` and `react-dom` version 19 or later are peer dependencies. Requires Node >= 24. Published on 0.x and versioned
on its own track: breaking changes ship as minor versions, so pin the minor if you need stability.

## Quick start

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

`setAppearance` updates the UI immediately, persists the value to `localStorage`, and broadcasts it to other tabs.
`isPending` is `true` while the persist is in flight.

## Appearance and color scheme

Two words, two meanings, kept apart throughout the API:

| Term          | Type                               | Meaning                                                                   |
| ------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| `Appearance`  | `"light" \| "dark" \| "automatic"` | The user's preference — think macOS System Settings: Light / Dark / Auto. |
| `ColorScheme` | `"light" \| "dark"`                | The value actually applied to the page, after `automatic` is resolved.    |

`automatic` resolves against the OS preference (`prefers-color-scheme`) and re-resolves when the OS switches. Where
`matchMedia` is unavailable — on the server — it resolves to `DEFAULT_COLOR_SCHEME`.

A three-state selector needs no hard-coded list, because `appearances` is `["light", "dark", "automatic"]`:

```tsx
import { appearances, useAppearance } from "@codefast/theme";
import type { Appearance } from "@codefast/theme";

function AppearanceSelect() {
  const { appearance, setAppearance, isPending } = useAppearance();

  return (
    <select
      disabled={isPending}
      value={appearance}
      onChange={(event) => setAppearance(event.target.value as Appearance)}
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

React hydrates after first paint, so server-rendered HTML alone would flash the wrong colors for a returning visitor.
`<AppearanceScript>` is a small inline script for `<head>`: it reads `localStorage`, resolves `automatic` through
`matchMedia`, and sets the class, the `color-scheme` style, and a `data-appearance` attribute on `<html>` before
anything paints.

A TanStack Start root shell (the same shape works in any framework that lets you render into the document head):

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

The server renders the defaults; the script corrects `<html>` before first paint and `suppressHydrationWarning` absorbs
the mismatch. On the client, the provider reads `localStorage` in its first render, so it starts from the same value the
script applied. Components that render preference-dependent markup still hydrate against the server's default once; gate
them behind a mounted flag if that matters.

The `data-appearance` attribute mirrors the preference (not the resolved value), so preference-aware UI can render
correctly from CSS on the very first frame:

```css
/* highlight the "Auto" option when the stored preference is automatic */
html[data-appearance="automatic"] .option-auto {
  background: var(--active);
}
```

If your Content Security Policy requires nonces for inline scripts, pass one: `<AppearanceScript nonce={cspNonce} />`.
The same prop exists on `<AppearanceProvider>` for the temporary inline style used by `disableTransition`.

### AppearanceScript props

| Prop         | Default           | Description                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------- |
| `appearance` | `"automatic"`     | Fallback preference when the storage entry is absent or unrecognised.            |
| `storageKey` | `"ui-appearance"` | `localStorage` key the script reads — must match the one passed to the provider. |
| `nonce`      | —                 | CSP nonce applied to the inline script element.                                  |

## Cross-tab sync

An appearance change propagates to every open tab. The provider posts the new value over a `BroadcastChannel` and also
listens for the `storage` event, so tabs stay in sync where the channel is unavailable. Incoming values are validated
against the appearance schema before they are applied, and each tab resolves `automatic` against its own OS preference.
Nothing to configure — it works with the default `localStorage` persistence.

## Custom persistence

Pass `persistAppearance` to store the preference somewhere other than `localStorage` — a user profile, for example. The
UI switches optimistically while the promise is pending; if it rejects, the UI reverts to the committed appearance and
`onPersistError` receives the error and the value that was attempted:

```tsx
import { AppearanceProvider } from "@codefast/theme";
import type { Appearance } from "@codefast/theme";

async function saveAppearance(value: Appearance): Promise<void> {
  const response = await fetch("/api/preferences", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ appearance: value }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save appearance: ${response.status}`);
  }
}

<AppearanceProvider persistAppearance={saveAppearance} onPersistError={(error) => console.error(error)}>
  {children}
</AppearanceProvider>;
```

When several calls overlap, only the latest one commits. A custom `persistAppearance` replaces the `localStorage` write
entirely, so `<AppearanceScript>` has nothing to read on the next visit — keep the default persistence if the pre-paint
script matters to you.

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
| `DEFAULT_APPEARANCE`                                                         | constant  | `"automatic"` — the fallback preference.                                                      |
| `DEFAULT_COLOR_SCHEME`                                                       | constant  | `"dark"` — the fallback when `matchMedia` is unavailable (SSR).                               |
| `Appearance`, `ColorScheme`                                                  | types     | The preference and resolved-value unions.                                                     |
| `AppearanceProviderProps`, `AppearanceScriptProps`, `AppearanceContextValue` | types     | Prop and context shapes.                                                                      |
| `STORAGE_KEY` (`@codefast/theme/constants`)                                  | constant  | `"ui-appearance"` — the default `localStorage` key.                                           |
| `getSystemColorScheme()` (`@codefast/theme/color-scheme`)                    | function  | Reads the OS preference via `matchMedia`; SSR-safe.                                           |
| `applyColorScheme()`, `suppressTransitions()` (`@codefast/theme/dom`)        | functions | DOM helpers for custom integrations.                                                          |
| `AppearanceContext` (`@codefast/theme/appearance-context`)                   | context   | Raw context for custom providers.                                                             |

Granular subpaths mirror the source modules for bundler-aware imports: `./appearance`, `./appearance-context`,
`./appearance-provider`, `./appearance-script`, `./color-scheme`, `./constants`, `./dom`, and `./use-appearance`.

### AppearanceProvider props

| Prop                | Default           | Description                                                                                   |
| ------------------- | ----------------- | --------------------------------------------------------------------------------------------- |
| `appearance`        | `"automatic"`     | Fallback preference when storage has no valid entry; also what SSR renders.                   |
| `storageKey`        | `"ui-appearance"` | `localStorage` key — must match the one passed to `<AppearanceScript>`.                       |
| `persistAppearance` | —                 | Custom async persistence replacing the `localStorage` auto-persist; rejection reverts the UI. |
| `onPersistError`    | —                 | Called with `(error, attemptedAppearance)` when `persistAppearance` rejects.                  |
| `disableTransition` | `false`           | Suppress CSS transitions while the color scheme swaps; respects `prefers-reduced-motion`.     |
| `nonce`             | —                 | CSP nonce for the inline style injected by `disableTransition`.                               |

## Documentation

- [Rendered docs on codefastlabs.com](https://codefastlabs.com/docs/theme)
- [CHANGELOG.md](./CHANGELOG.md) — release history

## Contributing

Issues and pull requests are welcome. Start with the repository's [contributing guide](../../CONTRIBUTING.md); it covers
the toolchain, the test layout, and the release flow.

## License

Released under the [MIT License](./LICENSE).
