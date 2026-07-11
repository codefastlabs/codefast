import type { ConsentRecord } from "#/core/consent";
import { isConsentRecord } from "#/core/consent";

/**
 * Cookie wire format for a `ConsentRecord` — URI-encoded JSON, single-sourced here so the
 * client mirror and the server reader can never drift. Raw JSON contains `"` and `,`,
 * which are not RFC 6265 cookie-octets, hence the encoding.
 */
export function encodeConsentCookieValue(record: ConsentRecord): string {
  return encodeURIComponent(JSON.stringify(record));
}

/**
 * Decodes a consent cookie value back to a `ConsentRecord` — `undefined` on malformed
 * encoding, malformed JSON, or a shape that fails the record guard; a tampered cookie
 * must read as "no decision", never as a grant.
 */
export function decodeConsentCookieValue(value: string): ConsentRecord | undefined {
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value));

    return isConsentRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
