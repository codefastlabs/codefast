---
"@codefast/ui": minor
---

Move `useLatest` to `@codefast/ui/hooks/use-latest` — the `./lib/message-scroller/utils` subpath is removed — and mirror
it in a layout effect so same-commit layout effects and MutationObserver callbacks read the fresh value, fixing
message-scroller auto-follow failing to arm on `autoScroll` flips. Add `@codefast/ui/hooks/use-has-hydrated` for
SSR-safe hydration gating. `useAnimatedValue` no longer snaps back and replays when `animated` flips back on, and drops
its per-frame mirror effect. Runtime dependencies (`lucide-react`, `input-otp`, `react-resizable-panels`,
`react-hook-form`) move to their latest releases, and orphaned `@since 1.0.0-canary` stamps are rewritten to the current
track.
