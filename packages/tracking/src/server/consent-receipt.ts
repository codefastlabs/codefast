import type { ConsentReceipt, ConsentReceiptInput } from "#/core/consent-receipt";

/**
 * The receipt information-structure version this builder emits (ISO/IEC TS 27560-shaped).
 * Bump when the receipt field set changes; stored receipts carry it so a reader can migrate.
 */
export const RECEIPT_SCHEMA_VERSION = "1.0.0";

const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;

/**
 * Coarsens an IP for storage — a full address MUST never be persisted (spec-consent-receipts
 * §4, R5). IPv4 drops the last two octets; IPv6 keeps only the first two hextets. This mirrors
 * the Cookiebot-style anonymization cited in the spec and is the maximally-private default;
 * a controller may widen it under counsel, but the builder never returns a full address.
 * Returns `undefined` for a missing or malformed input rather than storing a bad value.
 */
export function coarsenIp(ip: string | null | undefined): string | undefined {
  if (!ip) {
    return undefined;
  }

  const trimmed = ip.trim();

  if (IPV4_PATTERN.test(trimmed)) {
    const octets = trimmed.split(".");

    // Reject out-of-range octets (e.g. "999.1.1.1") rather than storing a malformed coarse value.
    if (octets.some((octet) => Number(octet) > 255)) {
      return undefined;
    }

    return `${octets[0]}.${octets[1]}.0.0`;
  }

  if (trimmed.includes(":")) {
    const [first, second] = trimmed.split(":");

    // Require two explicit leading hextets — a compressed-leading address ("::1", "fe80::1")
    // can't be coarsened without full expansion, so degrade to no stored value.
    if (!first || !second) {
      return undefined;
    }

    return `${first}:${second}::`;
  }

  return undefined;
}

/**
 * @remarks
 * `sign` is optional so the package never bakes a crypto secret: supply an HMAC/signature
 * function to stamp an `integrityKey`, letting a client prove its state matches the stored
 * original (spec-consent-receipts §5). Omit it and receipts carry no integrity key.
 */
export interface BuildConsentReceiptOptions {
  input: ConsentReceiptInput;
  /** The connection IP, read server-side — never accepted from the request body. */
  rawIp?: string | null | undefined;
  sign?: ((receipt: Omit<ConsentReceipt, "integrityKey">) => string) | undefined;
}

/**
 * Builds a stored consent receipt from caller input plus server-derived fields
 * (`receiptId`, `timestamp`, coarsened IP, optional `integrityKey`). Pure except for the
 * id/clock it stamps — pass those in via a seam if a deterministic build is needed.
 */
export function buildConsentReceipt(options: BuildConsentReceiptOptions): ConsentReceipt {
  const base: Omit<ConsentReceipt, "integrityKey"> = {
    ...options.input,
    ipCoarse: coarsenIp(options.rawIp),
    receiptId: crypto.randomUUID(),
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    timestamp: Date.now(),
  };

  const integrityKey = options.sign?.(base);

  return integrityKey === undefined ? base : { ...base, integrityKey };
}
