import { ONE_YEAR_IN_SECONDS } from "#/core/cookie";

// The only shape the client ever mints (crypto.randomUUID) — anything else is rejected.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Conservative subset of the RFC 6265 cookie-name token.
const COOKIE_NAME_PATTERN = /^[\w-]+$/;

/**
 * Guards the cookie name against anything outside the RFC 6265 token set.
 *
 * @throws Error when `cookieName` is not a valid token.
 *
 * @since 1.0.0-canary.7
 */
export function assertValidAnonymousIdCookieName(cookieName: string): void {
  if (!COOKIE_NAME_PATTERN.test(cookieName)) {
    throw new Error(`Invalid anonymous-id cookie name: ${JSON.stringify(cookieName)}`);
  }
}

/**
 * Whether a value is safe to persist as an anonymous id. The persist endpoint is public and
 * writes its input into a `Set-Cookie`, so only an exactly-UUID-shaped value may pass —
 * anything else is a header-injection attempt or corruption, never a valid id.
 *
 * @since 1.0.0-canary.6
 */
export function isValidAnonymousId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * @since 1.0.0-canary.6
 */
export interface AnonymousIdCookieOptions {
  /** Cookie name — must match what the client tracker reads. */
  cookieName: string;
  /** The client-minted id to persist — throws unless it is exactly UUID-shaped. */
  id: string;
  /** How long the id survives a return visit. Defaults to one year. */
  maxAgeSeconds?: number | undefined;
}

/**
 * The validated name/value plus cookie attributes for persisting a client-minted anonymous
 * id from the server — feed straight into the framework's cookie helper (`setCookie`).
 *
 * @remarks
 * Always `Secure` — on a plain-HTTP dev origin a browser may drop it, and the
 * client-written cookie (`createServerPersistedAnonymousId`'s optimistic write) still
 * covers that session. Not `httpOnly`: the client tracker must read the id to stamp it onto
 * events. A server-set cookie escapes Safari ITP's 7-day cap on `document.cookie` writes, so
 * the id actually lives its full max-age. The server only ever re-sets an id the client
 * hands it — minting stays client-side, after consent, by design.
 *
 * @throws Error when `id` is not UUID-shaped or `cookieName` is not a valid token.
 *
 * @since 1.0.0-canary.6
 */
export function resolveAnonymousIdCookie(options: AnonymousIdCookieOptions): {
  maxAge: number;
  name: string;
  path: string;
  sameSite: "lax";
  secure: true;
  value: string;
} {
  assertValidAnonymousIdCookieName(options.cookieName);

  if (!isValidAnonymousId(options.id)) {
    throw new Error("Invalid anonymous id: expected a UUID-shaped value");
  }

  return {
    maxAge: options.maxAgeSeconds ?? ONE_YEAR_IN_SECONDS,
    name: options.cookieName,
    path: "/",
    sameSite: "lax",
    secure: true,
    value: options.id,
  };
}

/**
 * Name plus attributes for expiring the anonymous-id cookie — the server half of a consent
 * withdrawal. Attributes must match {@link resolveAnonymousIdCookie} so the browser targets
 * the same cookie. Feed into the framework's `deleteCookie`.
 *
 * @throws Error when `cookieName` is not a valid token.
 *
 * @since 1.0.0-canary.6
 */
export function resolveClearAnonymousIdCookie(cookieName: string): {
  name: string;
  path: string;
  sameSite: "lax";
  secure: true;
} {
  assertValidAnonymousIdCookieName(cookieName);

  return { name: cookieName, path: "/", sameSite: "lax", secure: true };
}
