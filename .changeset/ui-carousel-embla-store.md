---
"@codefast/ui": patch
---

`Carousel` reads Embla's scroll bounds with `useSyncExternalStore` instead of copying them into state from a deferred
effect. Its cleanup now removes the `reInit` listener as well as `select`; before, an effect re-run on the same Embla
instance — as React's Strict Mode does in development — left a second `reInit` listener behind. `CarouselPrevious` and
`CarouselNext` also reflect the real bounds on the first render that has an Embla instance, rather than starting
disabled until a queued microtask ran, and that update no longer lands outside React's `act` in tests.
