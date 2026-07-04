---
"@codefast/ui": minor
---

Add `MessageScroller`, a headless-driven scroll manager for chat transcripts: follow-the-bottom autoscroll, scroll preservation on prepend, anchored streaming turns, `defaultScrollPosition`, and a self-hiding scroll-to-edge button. Ships the styled component (`@codefast/ui/message-scroller`), the headless primitive (`@codefast/ui/primitives/message-scroller`), and the `useMessageScroller`, `useMessageScrollerScrollable`, and `useMessageScrollerVisibility` hooks.

The scroll engine (geometry, stores, and controller hooks) is vendored from shadcn's `@shadcn/react/message-scroller` into `@codefast/ui` internals and adapted to codefast conventions, so it carries no extra runtime dependency. Adds an internal `useRender` utility that backs the primitives' `render` prop.
