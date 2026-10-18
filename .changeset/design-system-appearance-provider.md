---
"@internal/design-system": patch
---

The build failed after `@codefast/ui`'s `Toaster` began reading its color scheme from `@codefast/theme`: the Toaster
preview mounted with no `AppearanceProvider`, and the smoke check refused it. Each preview now renders inside an
`AppearanceProvider`, as the site's root does. `@codefast/theme`'s exports ride on `window.CodefastUI` beside the
components, so a preview's provider is the same copy `Toaster` reads, and its declarations join `index.d.ts`.
