---
"@codefast/cli": minor
---

`audit publish` also reports a shipped stylesheet whose Tailwind `@source` paths reach none of the files the slimmed
tarball ships, naming any `files` entry missing on disk so an unbuilt `dist` reads as such. A workspace resolves those
paths against `src`, so only the published layout used to show the failure.
