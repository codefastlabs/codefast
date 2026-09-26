---
"@codefast/ui": patch
---

The preset registers the published `dist` with Tailwind's `@source`, so an installed package styles its components
again. It registered only `src/**/*.{ts,tsx}`, which the tarball no longer ships, so the Quick start generated none of
the utilities the components use outside the monorepo.
