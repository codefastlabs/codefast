---
"@codefast/tracking": minor
---

Tighten the package's API contracts and framework independence, found in an architecture audit.

**Breaking:**

- `ClientTrackerOptions.anonymousId` is now `() => string` only — the plain-`string` form is removed. A resolver was already the documented best practice (defers minting an id until an event is actually allowed to send); the string form let callers accidentally mint one as an import-time side effect. Wrap a stable value in a resolver: `anonymousId: () => myId`.
- `Destination.send` now always returns `Promise<void>` — the previous `Promise<void> | void` let sync and async destinations disagree on contract. Mark a synchronous `send` `async` so a thrown error rejects the returned promise instead of throwing synchronously.

**Also:**

- `createVercelAnalyticsDestination` now imports `track` from the framework-agnostic `@vercel/analytics` instead of `@vercel/analytics/react` — the destination renders nothing, so it had no reason to depend on React.
- Adds `assertNever` (`@codefast/tracking/core`) and wires it into the `default` case of every `switch (event.type)` across the GA4/Vercel destinations — extending `TrackedEvent` with a new variant now fails to compile at every switch instead of silently falling through.
- The package root (`@codefast/tracking`) now re-exports `#/core`'s surface by explicit name instead of `export *`, matching the `client`/`server`/`destinations`/`react` subpaths, which were already explicit.
- `useConsent`'s returned object and its `save`/`denyAll`/`grantAll` callbacks are now memoized (`useMemo`/`useCallback`), so a consumer passing the hook's result down as a prop or effect dependency doesn't get a new reference every render.
