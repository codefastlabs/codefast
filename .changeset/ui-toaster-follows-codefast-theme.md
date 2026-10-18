---
"@codefast/ui": minor
---

`Toaster` takes its color scheme from `@codefast/theme` instead of `next-themes`, so toasts follow the user's appearance
like every other component rather than falling back to `"system"` in an app with no `next-themes` provider.
`@codefast/theme` (0.9 or later) is now a peer dependency, `next-themes` is no longer a dependency, and `Toaster` must
render inside an `AppearanceProvider` — outside one it throws, as `useAppearance` does.
