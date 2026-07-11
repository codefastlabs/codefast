import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type { ConsentCategory, ConsentDecision, InitialConsent } from "#/core/consent";
import type { ConsentConfig } from "#/core/consent-config";
import {
  buildAnonymousIdSetCookie,
  buildClearAnonymousIdSetCookie,
  readAnonymousIdCookie,
} from "#/server/anonymous-id-cookie";
import { readConsentDecisionCookie } from "#/server/consent-cookie";
import type { ServerTrackerContext } from "#/server/create-server-tracker";
import { resolveInitialConsent } from "#/server/initial-consent";

/**
 * Request/response glue for TanStack Start — each helper reads or writes the framework's
 * ambient request context (AsyncLocalStorage), so a consumer's server functions shrink to
 * one-line handlers around them. Server-only: deny this subpath in the client environment
 * via Start's `importProtection` — the compiler already strips it with stubbed handler bodies.
 */

export interface InitialConsentFromRequestOptions {
  /**
   * Header carrying the ISO 3166-1 alpha-2 country code.
   *
   * @defaultValue "x-vercel-ip-country"
   */
  countryHeaderName?: string | undefined;
  /** Categories the app's prompt asks about — opt-out regions grant exactly these by default. */
  requestedCategories: ReadonlyArray<ConsentCategory>;
}

/**
 * Region-correct `InitialConsent` for the current request: reads the platform geo header
 * and `sec-gpc`, fails closed when geo is missing, and stamps
 * `cache-control: private, no-store` — the value is per-visitor by definition, so no
 * shared cache may ever store the response carrying it.
 */
export function resolveInitialConsentFromRequest(options: InitialConsentFromRequestOptions): InitialConsent {
  setResponseHeader("cache-control", "private, no-store");

  return resolveInitialConsent({
    countryCode: getRequestHeader(options.countryHeaderName ?? "x-vercel-ip-country"),
    hasGlobalPrivacyControlSignal: getRequestHeader("sec-gpc") === "1",
    requestedCategories: options.requestedCategories,
  });
}

export interface AnonymousIdResponseCookieOptions {
  /** Cookie name — must match what the client tracker reads. */
  cookieName: string;
  /** The client-minted id to persist — throws unless it is exactly UUID-shaped. */
  id: string;
  /** How long the id survives a return visit. Defaults to one year. */
  maxAgeSeconds?: number | undefined;
}

/**
 * Persists (or prolongs) a client-minted anonymous id via `Set-Cookie` on the current
 * response — the server re-issue that escapes Safari ITP's 7-day cap on script-written
 * cookies. Validation lives in `buildAnonymousIdSetCookie`: a non-UUID id throws, so this
 * can safely back a public server function without echoing attacker input into a header.
 */
export function setAnonymousIdResponseCookie(options: AnonymousIdResponseCookieOptions): void {
  setResponseHeader(
    "set-cookie",
    buildAnonymousIdSetCookie({
      cookieName: options.cookieName,
      id: options.id,
      maxAgeSeconds: options.maxAgeSeconds,
    }),
  );
}

/** Expires the anonymous-id cookie on the current response — the server half of a consent withdrawal. */
export function clearAnonymousIdResponseCookie(cookieName: string): void {
  setResponseHeader("set-cookie", buildClearAnonymousIdSetCookie(cookieName));
}

/** The current request's anonymous id, or `undefined` when absent or not UUID-shaped. */
export function readAnonymousIdRequestCookie(cookieName: string): string | undefined {
  return readAnonymousIdCookie(getRequestHeader("cookie"), cookieName);
}

/**
 * The current request's stored consent decision under the given policy version — the
 * gate that keeps server-owned tracking honoring exactly what the visitor chose. Requires
 * the client to mirror decisions into a cookie via `withConsentCookieMirror`.
 */
export function readConsentDecisionRequestCookie(config: ConsentConfig): ConsentDecision | undefined {
  return readConsentDecisionCookie(getRequestHeader("cookie"), config);
}

export interface ServerTrackerContextFromRequestOptions {
  /** Cookie name the client tracker persists its anonymous id under. */
  anonymousIdCookieName: string;
  /**
   * Header carrying a stable request id (e.g. Vercel's `x-vercel-id`) — when set and
   * present, retried requests reproduce the same `eventId` for destination-side dedup.
   */
  requestIdHeaderName?: string | undefined;
  userId?: string | undefined;
}

/**
 * Assembles a `ServerTrackerContext` from the current request, or `undefined` when the
 * visitor has no valid anonymous id yet — pair with `ServerTracker.withContext` so
 * handlers track without re-parsing cookies:
 *
 * @example
 * ```ts
 * const context = resolveServerTrackerContextFromRequest({ anonymousIdCookieName });
 * if (context) await tracker.withContext(context).track("order_completed", { total });
 * ```
 */
export function resolveServerTrackerContextFromRequest(
  options: ServerTrackerContextFromRequestOptions,
): ServerTrackerContext | undefined {
  const anonymousId = readAnonymousIdRequestCookie(options.anonymousIdCookieName);

  if (anonymousId === undefined) {
    return undefined;
  }

  const requestId =
    options.requestIdHeaderName === undefined ? undefined : getRequestHeader(options.requestIdHeaderName);

  return {
    anonymousId,
    ...(requestId === undefined ? {} : { requestId }),
    ...(options.userId === undefined ? {} : { userId: options.userId }),
  };
}
