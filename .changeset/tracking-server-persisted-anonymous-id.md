---
"@codefast/tracking": minor
---

Add server-persisted anonymous id ("client mints, server persists"). `createServerPersistedAnonymousId` (client) keeps the lazy, post-consent minting of `createCookieAnonymousId` and delegates the durable cookie write to an app-supplied server round-trip, so the id outlives Safari ITP's 7-day cap on script-written cookies. The server half — `readAnonymousIdCookie`, `buildAnonymousIdSetCookie`, `buildClearAnonymousIdSetCookie`, `isValidAnonymousId` — is framework-agnostic string-in/string-out: always `Secure; SameSite=Lax`, validates the cookie name, and throws on any non-UUID id so a public persist endpoint can never echo attacker input into a response header. The server persists and prolongs an id the client hands it; it never mints one per request.
