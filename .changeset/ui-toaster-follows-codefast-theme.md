---
"@codefast/ui": minor
---

**Breaking:** `Toaster` takes its color scheme from `@codefast/theme` instead of `next-themes`, so toasts follow the
user's appearance like every other component rather than falling back to `"system"` in an app with no `next-themes`
provider. `@codefast/theme` 0.10 or later — the version this release ships — is now a peer dependency, `next-themes` is
no longer a dependency, and `Toaster` must render inside an `AppearanceProvider` — outside one it throws, as
`useAppearance` does.
