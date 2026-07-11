import type { ConsentDecision, ConsentRecord } from "#/core/consent";
import { normalizeConsentDecision } from "#/core/consent";
import { decodeConsentCookieValue } from "#/core/consent-cookie";
import { readCookieValue } from "#/core/cookie";

/**
 * The visitor's consent record carried by a request's `Cookie` header (written by the
 * client's `withConsentCookieMirror`), or `undefined` when absent or malformed — this is
 * what makes server-owned tracking consent-aware instead of consent-blind.
 */
export function readConsentRecordCookie(
  cookieHeader: string | null | undefined,
  cookieName: string,
): ConsentRecord | undefined {
  const value = readCookieValue(cookieHeader, cookieName);

  return value === undefined ? undefined : decodeConsentCookieValue(value);
}

export interface ConsentDecisionCookieOptions {
  cookieName: string;
  /** Must match the client's `policyVersion` — a superseded record reads as "no decision". */
  policyVersion: string;
}

/**
 * The request's stored decision under the current policy version, normalized to drop
 * tampered extra keys — the server-side mirror of `readStoredDecision`, so a server
 * handler gates on exactly the rule the client tracker applies.
 */
export function readConsentDecisionCookie(
  cookieHeader: string | null | undefined,
  options: ConsentDecisionCookieOptions,
): ConsentDecision | undefined {
  const record = readConsentRecordCookie(cookieHeader, options.cookieName);

  if (record?.policyVersion !== options.policyVersion) {
    return undefined;
  }

  return normalizeConsentDecision(record.decision);
}
