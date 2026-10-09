---
"@codefast/ui": minor
---

The `@codefast/ui/lib/message-scroller/geometry`, `stores` and `types` subpaths are no longer published: they are the
message-scroller primitive's internals. Its public types now ship from `@codefast/ui/primitives/message-scroller`, and
`MessageScrollerButtonRenderState` and `MessageScrollerButtonDirection` — the button's `render` state and `direction` —
are also exported from `@codefast/ui/message-scroller` and the root entry, so every type in the scroller's public
signatures stays nameable.
