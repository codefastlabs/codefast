---
"@codefast/ui": minor
---

The root entry, `@codefast/ui`, now re-exports `useHasHydrated` and `useLatest`, so every published hook is reachable
from it. The `@codefast/ui/hooks/use-message-scroller-commands`, `use-message-scroller-controller` and
`use-message-scroller-refs` subpaths are no longer published: they pass the message-scroller primitive's private ref
bags between its own parts and were never usable on their own — compose a scroller from
`@codefast/ui/primitives/message-scroller` or `@codefast/ui/message-scroller` instead.
