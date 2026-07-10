---
"@codefast/tracking": minor
---

Gate the client tracker on consent and keep destinations from leaking pre-consent or duplicate data.

`createClientTracker` gains `isTrackingAllowed?: () => boolean`, consulted per event — while it returns `false` nothing is sent or queued, so a mid-session consent change applies immediately. `anonymousId` also accepts a `() => string` resolver, invoked only when an event is actually allowed to send, so apps can defer minting an identifier cookie until consent exists. `storage` is now optional; without it the queue lives in memory only instead of persisting to `localStorage`. The Vercel destination takes an options object (`{ name?, trackPageViews? }` replaces the positional name), drops `$page_viewed` unless `trackPageViews` is on — the mounted `<Analytics />` component already tracks page views natively — and drops `$identify`/`$group`, which Vercel Analytics has no identity API to translate to. The global `gtag` type gains the `config` and `js` command signatures so apps can queue them directly, e.g. when loading gtag.js on demand for basic Consent Mode.
