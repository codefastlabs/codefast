---
"@codefast/theme": minor
---

fix(theme): harden appearance provider/script and tighten public types

Three correctness fixes plus two type-safety tightenings:

- Overlapping `setAppearance` calls with `disableTransition` enabled could orphan a transition-suppression `<style>` —
  `enableTransitionsRef` was overwritten before the previous cleanup ran — leaving `*{transition:none}` in `<head>`
  forever and permanently disabling CSS transitions. Each call now flushes the pending suppression before injecting a
  new one.
- `AppearanceScript` now runtime-validates its `appearance` prop (as `AppearanceProvider` already did), so an invalid
  value can no longer be written to `<html>` before first paint or diverge from the provider's fallback.
- `applyColorScheme` no-ops during SSR instead of throwing on `window` access, matching its sibling
  `suppressTransitions`.
- Public props on `AppearanceProvider` and `AppearanceScript` now accept explicit `undefined` (`?: T | undefined`) under
  `exactOptionalPropertyTypes`, so JSX callers can pass possibly-undefined expressions such as `nonce` and `appearance`.

Breaking (type surface only, no runtime behavior change): `appearances` is now `ReadonlyArray<Appearance>` (was
`Array<Appearance>`), so assigning it to a mutable `Appearance[]` is now a compile error.
