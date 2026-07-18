# spec-identity — Anonymous Id Lifecycle

The key words MUST, MUST NOT, SHOULD, and MAY are to be interpreted as described in RFC 2119.

## 1. Principles

- The anonymous id identifies a **browser/device**, not a person. Its only valid shape is a random UUID (RFC 4122), pattern `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$` (case-insensitive).
- **The client mints; the server never does.** Minting happens lazily, only at the moment an event is actually allowed to send (spec-tracker §3) — never at library init, never as an import/startup side effect, never while the consent gate is closed.
- The server's only roles are to **persist/prolong** an id the client hands it and to **expire** it on withdrawal.

## 2. Cookie contract

The id lives in a cookie (not local-only storage) so a future server-owned event could read the same id from the request.

- **Name**: a token matching `^[A-Za-z0-9_-]+$` (conservative subset of the RFC 6265 token). Builders MUST reject any other name.
- **Value**: the UUID.
- **Attributes**: `Path=/`; `Max-Age` defaulting to one year (31536000 seconds); `SameSite=Lax`; never `HttpOnly` (the client tracker must read the id back). Client-side writes add `Secure` on HTTPS origins; server-issued Set-Cookie headers are always `Secure` (on a plain-HTTP dev origin the browser may drop it — the client-written cookie still covers that session).
- **Reading** a cookie string (`name=value; name2=value2` wire format): the name must match exactly; a longer prefix sibling (`myidX` when reading `myid`) MUST NOT match.

## 3. Client-side id manager

Operations and their semantics:

- `getOrCreate()` — return the existing cookie value, else mint a fresh UUID, write the cookie, and return it. The **live cookie always wins over any in-memory cache**: another tab's withdrawal expires the cookie without notifying this instance, and a re-grant MUST NOT revive the pre-withdrawal identity from memory.
- `refresh()` — roll an **existing** id's expiry forward without ever minting; a no-op for visitors who have no id. Safe to call on page load for returning consented visitors.
- `clear()` — expire the cookie (Max-Age 0) and drop any cached copy. Called on consent withdrawal (spec-consent §9).
- Implementations MAY cache the id after the first read so a per-event callback does not re-parse the cookie header; the cache MUST be invalidated by `clear()` and never trusted over the live cookie.

## 4. Server persistence (the ITP re-issue)

Script-written cookies are capped (e.g. 7 days by Safari ITP); a server Set-Cookie re-issue is what lets the id live its full max-age. A server-persisted id manager wraps the client one:

- **Optimistic local write first** — the current event never waits on a round trip; a failed persist degrades to plain client-side behavior.
- **At most one persist request per page load**, fired only after an id exists client-side. The re-issue also fires when the cookie already existed (it upgrades a script-written cookie to a server-set one and rolls expiry forward). `refresh()` shares the same once-per-load budget — it MUST NOT add a second request.
- If the cookie disappears out-of-band (cross-tab withdrawal), the once-per-load flag resets so the next minted id is persisted again. Likewise after a local `clear()` — a fresh id after a re-grant must be persisted again.
- Persist/clear round-trip failures MUST be swallowed (tracking never breaks the app).
- `clear()` also requests the server-side expiry — but only when the cookie actually exists, so a second withdrawal from another mounted consent surface in the same tick costs no extra request.

**Server endpoint requirements.** The persist endpoint is public and echoes its input into a response header, so:

- It MUST validate the incoming id against the exact UUID pattern (§1) and reject anything else — a non-UUID value is a header-injection attempt or corruption, never a valid id.
- It MUST validate the cookie name against the token pattern (§2).
- On success it answers with a Set-Cookie header persisting the id (§2 attributes); the clear endpoint answers with the same cookie at `Max-Age=0`.
- The server MUST only ever re-set an id the client handed it — never generate one.

## 5. Withdrawal

On a decision with `analytics == false`: client-side `clear()` (cookie expiry + cache drop) plus the server-side expiry per §4. Destination identifier cookies are cleared per spec-destinations §4.

## Conformance vectors

**V1 — id shape.** `"6f1c2a4e-9b0d-4c3e-8f5a-1d2e3c4b5a69"` valid; uppercase hex valid; `"not-a-uuid"`, `""`, `"6f1c2a4e-9b0d-4c3e-8f5a-1d2e3c4b5a69; Path=/evil"` invalid — the persist endpoint rejects them.

**V2 — Set-Cookie build.** (name `anon_id`, id `U`, default max-age) → `anon_id=U; Path=/; Max-Age=31536000; SameSite=Lax; Secure`. Clear → `anon_id=; Path=/; Max-Age=0; SameSite=Lax; Secure`. Name `bad name` → error.

**V3 — exact-name cookie read.** Cookie string `anon_idX=zzz; anon_id=abc` read as `anon_id` → `abc`; string `anon_idX=zzz` → none.

**V4 — lazy mint.** With the gate closed, no `track()` call ever creates a cookie. With the gate open, the first permitted `track()` mints exactly one id; subsequent events reuse it.

**V5 — cross-tab withdrawal.** After the cookie is expired externally, `getOrCreate()` mints a **new** UUID (never returns the cached old one), and the persist request fires again for the new id.

**V6 — once-per-load persist.** Three permitted events on one page load → exactly one persist request. A `refresh()` after `getOrCreate()` on the same load → still one request.
