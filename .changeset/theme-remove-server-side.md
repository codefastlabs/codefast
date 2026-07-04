---
"@codefast/theme": patch
---

Remove all server-side handling — the color scheme preference now lives entirely on the client in `localStorage`.

**Breaking:**

- Removed `@codefast/theme/start`, `@codefast/theme/vite`, and `@codefast/theme/adapters/tanstack-start/server` — the TanStack Start server functions, httpOnly cookie persistence, and the Vite plugin that wired them into consumer builds.
- Removed `AppearanceProvider`'s `ssrColorScheme` and `syncFromServer` props; the provider also no longer re-syncs from a changed `colorScheme` prop after mount (it is a static fallback now).
- `resolveColorScheme()` no longer takes an `ssrColorScheme` argument; on the server, `"automatic"` resolves to `DEFAULT_RESOLVED_COLOR_SCHEME`.
- Dropped the optional `@tanstack/react-start` and `vite` peer dependencies.

**Changed defaults:** `storageKey` now defaults to `STORAGE_KEY` (`"ui-theme"`) and `colorScheme` to `DEFAULT_COLOR_SCHEME` (`"automatic"`) on both `AppearanceScript` and `AppearanceProvider`, so `<AppearanceScript />` + `<AppearanceProvider>` work with zero configuration. `persistColorScheme` / `onPersistError` remain for custom persistence.

Migration: drop the root loader and the `codefastTheme()` Vite plugin, render the defaults on `<html>` with `suppressHydrationWarning`, and let the inline script correct the class before paint — see the README's TanStack Start recipe.
