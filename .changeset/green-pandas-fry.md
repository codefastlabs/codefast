---
"@codefast/theme": patch
---

Security, correctness, and performance improvements to `ThemeProvider` and `ThemeScript`.

**Security**

- Validate `BroadcastChannel` messages with `themeSchema.safeParse` before applying — prevents injection from browser extensions or other same-origin scripts
- Use `JSON.stringify` in `ThemeScript` inline script to safely serialise the theme value

**Correctness**

- `ThemeProvider` now re-syncs internal state when the `theme` prop changes after mount (e.g. router re-runs the root loader), making the server the authoritative source of truth
- Fixed `disableTransitionOnChange` timing: animation cleanup now fires after `applyTheme` commits to the DOM instead of prematurely in the async persist `finally` block
- Added last-write-wins guard (`intentRef`) so rapid `setTheme` calls only commit the most recent intent

**Performance**

- `setTheme` callback is now stable across theme commits (reads `committedThemeRef` instead of capturing `theme` in deps) — prevents unnecessary re-renders in consumers
- `BroadcastChannel` is reused from a shared ref instead of opening a new channel on every `setTheme` call
- Removed obsolete `-moz-`, `-o-`, `-ms-` vendor prefixes from the `disableAnimation` CSS injection

**Features**

- `ThemeScript` accepts a new `storageKey` prop: when set, the inline script reads `localStorage` before first paint for FOUC-free client-only apps
- Runtime Zod validation of the `theme` prop in `ThemeProvider` guards against invalid values bypassing TypeScript

**Docs / Tests**

- Fixed README: `THEME_STORAGE_KEY` import example now correctly points to `@codefast/theme/constants`
- Added integration tests for the TanStack Start adapter server functions
- New test coverage for all security and correctness fixes above
