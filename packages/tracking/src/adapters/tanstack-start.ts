import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type { ConsentCategory, InitialConsent } from "#/core/consent";
import type { ConsentReceipt, ConsentReceiptInput } from "#/core/consent-receipt";
import { isConsentReceiptInput } from "#/core/consent-receipt";
import { buildAnonymousIdSetCookie, buildClearAnonymousIdSetCookie } from "#/server/anonymous-id-cookie";
import { buildConsentReceipt } from "#/server/consent-receipt";
import type { ReceiptStore } from "#/server/consent-receipt-store";
import { resolveInitialConsent } from "#/server/initial-consent";

export type { InitialConsent };

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
 *
 * Server-only: deny this subpath in the client environment via Start's `importProtection`
 * — the compiler already strips it with stubbed handler bodies.
 *
 * @since 1.0.0-canary.6
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
 *
 * @since 1.0.0-canary.6
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

/**
 * Expires the anonymous-id cookie on the current response — the server half of a consent withdrawal.
 *
 * @since 1.0.0-canary.6
 */
export function clearAnonymousIdResponseCookie(cookieName: string): void {
  setResponseHeader("set-cookie", buildClearAnonymousIdSetCookie(cookieName));
}

/** Order the connection IP is read from — first forwarded hop wins, then the single real-ip header. */
const IP_HEADER_NAMES: ReadonlyArray<string> = ["x-forwarded-for", "x-real-ip"];

function readConnectionIp(): string | undefined {
  for (const headerName of IP_HEADER_NAMES) {
    const value = getRequestHeader(headerName);

    if (value) {
      // x-forwarded-for is "client, proxy1, proxy2" — the client is the first hop.
      return value.split(",")[0]?.trim();
    }
  }

  return undefined;
}

/**
 * The client-visible acknowledgement of a recorded receipt — deliberately minimal so the
 * stored PII (`subjectId`, `ipCoarse`) is never echoed back over the wire.
 */
export interface ConsentReceiptAck {
  receiptId: string;
  timestamp: number;
}

export interface RecordConsentReceiptFromRequestOptions {
  input: ConsentReceiptInput;
  /**
   * Optional tamper-evidence signer — supply an HMAC/signature over the receipt to stamp an
   * `integrityKey`. Omit it and the stored receipt carries none.
   */
  sign?: ((receipt: Omit<ConsentReceipt, "integrityKey">) => string) | undefined;
  store: ReceiptStore;
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
  setResponseHeader("cache-control", "no-store");

  if (!isConsentReceiptInput(options.input)) {
    throw new Error("Invalid consent receipt input");
  }

  const receipt = buildConsentReceipt({ input: options.input, rawIp: readConnectionIp(), sign: options.sign });

  await options.store.append(receipt);

  return { receiptId: receipt.receiptId, timestamp: receipt.timestamp };
}
