---
"@codefast/tracking": minor
---

Adopt TanStack Start's first-class server helpers in the adapter instead of hand-rolling over raw request/response headers.

- The anonymous-id cookie is now written with `setCookie`/`deleteCookie` (from `@tanstack/react-start/server`) rather than `setResponseHeader("set-cookie", …)`. The raw header call **replaces** any existing `Set-Cookie` on the response — it would clobber a session or framework cookie set on the same response — whereas `setCookie` appends. No behavior change to the emitted cookie (still `Path=/; Max-Age=1y; SameSite=Lax; Secure`, not `HttpOnly`).
- The connection IP for consent receipts is now read with `getRequestIP({ xForwardedFor: true })` — the maintained, platform-aware path — instead of hand-parsing `x-forwarded-for`/`x-real-ip`.

Breaking (`@codefast/tracking/server/anonymous-id-cookie`): the string builders `buildAnonymousIdSetCookie`/`buildClearAnonymousIdSetCookie` are replaced by `resolveAnonymousIdCookie`/`resolveClearAnonymousIdCookie`, which return the validated name/value plus cookie attributes for a framework `setCookie`/`deleteCookie` call. `isValidAnonymousId` is unchanged; the cookie-name guard is now the exported `assertValidAnonymousIdCookieName`.
