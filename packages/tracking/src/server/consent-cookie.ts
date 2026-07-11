import type { ConsentDecision, ConsentRecord } from "#/core/consent";
import { normalizeConsentDecision } from "#/core/consent";
import type { ConsentConfig } from "#/core/consent-config";
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

/**
 * The request's stored decision under the current policy version, normalized to drop
 * tampered extra keys — the server-side mirror of `readStoredDecision`, so a server
 * handler gates on exactly the rule the client tracker applies. Takes the same
 * `ConsentConfig` the client runtime mirrors from, so the cookie name and policy
 * version can never drift between the two sides.
 *
 * @throws Error when the config names no `decisionCookieName` — a wiring bug, not "no decision".
 */
export function readConsentDecisionCookie(
  cookieHeader: string | null | undefined,
  config: ConsentConfig,
): ConsentDecision | undefined {
  if (config.decisionCookieName === undefined) {
    throw new Error("[tracking] readConsentDecisionCookie requires config.decisionCookieName");
  }

  const record = readConsentRecordCookie(cookieHeader, config.decisionCookieName);

  if (record?.policyVersion !== config.policyVersion) {
    return undefined;
  }

  return normalizeConsentDecision(record.decision);
}
