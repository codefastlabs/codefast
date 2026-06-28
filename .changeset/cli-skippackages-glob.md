---
"@codefast/cli": patch
---

`codefast tag` now matches `tag.skipPackages` entries as glob patterns (picomatch), so a single `@apps/*` entry skips every private app instead of listing each by name. This fixes the release `Publish packages` step failing on `@apps/start-demo` (a private, version-less app the command tried to tag). The compile-patterns-then-match-any logic is now shared via a single `createAnyGlobMatcher` helper, also used by workspace-package discovery.
