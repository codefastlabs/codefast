import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type {
  AnonymousIdResponseCookieOptions,
  ConsentReceiptAck,
  InitialConsentFromRequestOptions,
  RecordConsentReceiptFromRequestOptions,
  RequestContext,
} from "#/adapters/request-context";
import {
  clearAnonymousIdResponseCookieOnContext,
  recordConsentReceiptFromContext,
  resolveInitialConsentFromContext,
  setAnonymousIdResponseCookieOnContext,
} from "#/adapters/request-context";
import type { InitialConsent } from "#/core/consent";

export type {
  AnonymousIdResponseCookieOptions,
  ConsentReceiptAck,
  InitialConsentFromRequestOptions,
  RecordConsentReceiptFromRequestOptions,
};

/**
 * Request/response glue for TanStack Start — binds the framework's ambient request context
 * (AsyncLocalStorage) to the framework-neutral {@link RequestContext} seam, so every helper
 * below is a one-line delegation. Server-only: deny this subpath in the client environment
 * via Start's `importProtection` — the compiler already strips it with stubbed handler bodies.
 */
const tanStackRequestContext: RequestContext = {
  getHeader: (name) => getRequestHeader(name),
  setHeader: (name, value) => {
    setResponseHeader(name, value);
  },
};

/**
 * Region-correct `InitialConsent` for the current request: reads the platform geo header
 * and `sec-gpc`, fails closed when geo is missing, and stamps
 * `cache-control: private, no-store` — the value is per-visitor by definition, so no
 * shared cache may ever store the response carrying it.
 *
 * @since 1.0.0-canary.6
 */
export function resolveInitialConsentFromRequest(options: InitialConsentFromRequestOptions): InitialConsent {
  return resolveInitialConsentFromContext(tanStackRequestContext, options);
}

/**
 * Persists (or prolongs) a client-minted anonymous id via `Set-Cookie` on the current
 * response — the server re-issue that escapes Safari ITP's 7-day cap on script-written
 * cookies. Validation lives in `buildAnonymousIdSetCookie`: a non-UUID id throws, so this
 * can safely back a public server function without echoing attacker input into a header.
 *
 * @since 1.0.0-canary.6
 */
export function setAnonymousIdResponseCookie(options: AnonymousIdResponseCookieOptions): void {
  setAnonymousIdResponseCookieOnContext(tanStackRequestContext, options);
}

/**
 * Expires the anonymous-id cookie on the current response — the server half of a consent withdrawal.
 *
 * @since 1.0.0-canary.6
 */
export function clearAnonymousIdResponseCookie(cookieName: string): void {
  clearAnonymousIdResponseCookieOnContext(tanStackRequestContext, cookieName);
}

/**
 * Records a consent receipt for the current request: rejects a body-supplied IP, derives a
 * coarsened one from the connection, builds the server-stamped receipt, appends it to the
 * store, and stamps `cache-control: no-store` — the response carries PII, so no cache
 * (shared or private) may store it. Returns a minimal ack, never the stored record.
 *
 * @throws Error when `input` fails {@link isConsentReceiptInput} (including a body that
 * carries an `ip`/`ipCoarse` field — the server owns IP derivation).
 */
export async function recordConsentReceiptFromRequest(
  options: RecordConsentReceiptFromRequestOptions,
): Promise<ConsentReceiptAck> {
  return recordConsentReceiptFromContext(tanStackRequestContext, options);
}
