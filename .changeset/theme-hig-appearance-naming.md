---
"@codefast/theme": patch
---

Rename the public API to follow Apple's Human Interface Guidelines vocabulary: **appearance** is the user's preference (`"light" | "dark" | "automatic"`, like macOS System Settings → Appearance), **color scheme** is the resolved light-or-dark value actually applied (like SwiftUI `ColorScheme` and CSS `color-scheme`). Source files are also flattened so each subpath names what it exports.

**Breaking renames:**

- Types: `ColorScheme` → `Appearance`; `ResolvedColorScheme` → `ColorScheme`; `ColorSchemeContextType` → `AppearanceContextType`; `colorSchemeSchema` → `appearanceSchema`; `colorSchemes` → `appearances`.
- Hook: `useColorScheme()` → `useAppearance()`, returning `{ appearance, colorScheme, setAppearance, isPending }` (was `{ colorScheme, resolvedColorScheme, setColorScheme, isPending }`).
- Provider props: `colorScheme` → `appearance`; `persistColorScheme` → `persistAppearance`. Script prop: `colorScheme` → `appearance`. Context: `ColorSchemeContext` → `AppearanceContext`.
- Constants: `DEFAULT_COLOR_SCHEME` → `DEFAULT_APPEARANCE` (`"automatic"`); `DEFAULT_RESOLVED_COLOR_SCHEME` → `DEFAULT_COLOR_SCHEME` (`"dark"`). ⚠️ `DEFAULT_COLOR_SCHEME` still exists but now means the resolved fallback — the prop renames make stale usage a compile error.
- Subpaths: `./types` → `./appearance`; `./core/provider` → `./appearance-provider`; `./core/use-theme` → `./use-appearance`; `./core/context` → `./appearance-context`; `./script/theme-script` → `./appearance-script`; `./utils/system` → `./color-scheme`; `./utils/dom` → `./dom`.

Unchanged: `AppearanceProvider` / `AppearanceScript` component names, the `data-appearance` attribute, the `"ui-theme"` storage key (existing visitors keep their saved preference), `resolveColorScheme()` / `getSystemColorScheme()` / `applyColorScheme()` / `suppressTransitions()`, and `STORAGE_KEY` in `/constants`.
