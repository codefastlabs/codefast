---
"@codefast/theme": minor
---

Add a `storageKey` prop to `AppearanceProvider` for a fully client-side color scheme path (no server framework, cookie, or loader). When set, the provider reads the persisted preference from `localStorage` in its initial client render, auto-persists changes there (unless an explicit `persistColorScheme` is given), and syncs across tabs via the `storage` event. Paired with `<AppearanceScript storageKey>` using the same key, the inline script applies the stored value before first paint — so there is **no flash even on statically prerendered / CDN-served pages**, where an httpOnly cookie can't reach the pre-paint script and a post-mount server round-trip would otherwise flip the appearance.

`AppearanceScript` and `AppearanceProvider` now also mirror the **preference** (`light` / `dark` / `automatic`) to a `data-appearance` attribute on `<html>` — set by the inline script before first paint and kept in sync by the provider. This lets preference-aware UI (e.g. a 3-state theme toggle that shows a distinct "system" icon) render the correct state purely from CSS, with no hydration flash from reading client-only state.
