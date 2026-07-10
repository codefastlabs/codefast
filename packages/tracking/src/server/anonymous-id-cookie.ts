import { readCookieValue } from "#/core/cookie";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

// The only shape the client ever mints (crypto.randomUUID) — anything else is rejected.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Conservative subset of the RFC 6265 cookie-name token.
const COOKIE_NAME_PATTERN = /^[\w-]+$/;

function assertCookieName(cookieName: string): void {
  if (!COOKIE_NAME_PATTERN.test(cookieName)) {
    throw new Error(`Invalid anonymous-id cookie name: ${JSON.stringify(cookieName)}`);
  }
}

/**
 * Whether a value is safe to persist as an anonymous id. The persist endpoint is public
 * and echoes its input into a response header, so only an exactly-UUID-shaped value may
 * pass — anything else is a header-injection attempt or corruption, never a valid id.
 */
export function isValidAnonymousId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * The anonymous id carried by a request's `Cookie` header, or `undefined` when absent or
 * not UUID-shaped — a tampered value must not propagate into server-owned events.
 */
export function readAnonymousIdCookie(cookieHeader: string | null | undefined, cookieName: string): string | undefined {
  assertCookieName(cookieName);

  const value = readCookieValue(cookieHeader, cookieName);

  return value !== undefined && isValidAnonymousId(value) ? value : undefined;
}

export interface BuildAnonymousIdSetCookieOptions {
  /** Cookie name — must match what the client tracker reads. */
  cookieName: string;
  /** The client-minted id to persist — throws unless it is exactly UUID-shaped. */
  id: string;
  /** How long the id survives a return visit. Defaults to one year. */
  maxAgeSeconds?: number | undefined;
}

/**
 * `Set-Cookie` header value that persists (or prolongs) a client-minted anonymous id from
 * the server. A server-set cookie escapes Safari ITP's 7-day cap on `document.cookie`
 * writes, so the id actually lives its full max-age. The server only ever re-sets an id
 * the client hands it — minting stays client-side, after consent, by design.
 *
 * @remarks
 * Always `Secure` — on a plain-HTTP dev origin a browser may drop it, and the
 * client-written cookie (`createServerPersistedAnonymousId`'s optimistic write) still
 * covers that session. Not `HttpOnly`: the client tracker must read the id to stamp it
 * onto events.
 *
 * @throws Error when `id` is not UUID-shaped or `cookieName` is not a valid token.
 */
export function buildAnonymousIdSetCookie(options: BuildAnonymousIdSetCookieOptions): string {
  const { cookieName, id, maxAgeSeconds = ONE_YEAR_IN_SECONDS } = options;

  assertCookieName(cookieName);

  if (!isValidAnonymousId(id)) {
    throw new Error("Invalid anonymous id: expected a UUID-shaped value");
  }

  return `${cookieName}=${id}; Path=/; Max-Age=${String(maxAgeSeconds)}; SameSite=Lax; Secure`;
}

/**
 * `Set-Cookie` header value that expires the anonymous-id cookie — the server half of a
 * consent withdrawal, alongside the client's own `document.cookie` expiry.
 */
export function buildClearAnonymousIdSetCookie(cookieName: string): string {
  assertCookieName(cookieName);

  return `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}
