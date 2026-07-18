import { createHmac } from "node:crypto";

import type { ConsentReceipt } from "@codefast/tracking";

/**
 * HMAC-SHA256 signer over a receipt, keyed by `CONSENT_RECEIPT_SECRET`. Stamps the
 * receipt's `integrityKey` so a reader can later prove a stored receipt was not altered
 * (spec-consent-receipts §5). Returns `undefined` when the secret is unset (local dev),
 * so receipts stay unsigned rather than break — production sets the secret. Server-only:
 * the `.server` suffix + `node:crypto` keep the secret off the client graph.
 */
export function createReceiptSigner(): ((receipt: Omit<ConsentReceipt, "integrityKey">) => string) | undefined {
  const secret = process.env.CONSENT_RECEIPT_SECRET;

  if (!secret) {
    return undefined;
  }

  // The builder always emits the receipt's keys in the same order, so JSON.stringify is a
  // stable signing input a verifier can reproduce.
  return (receipt) => createHmac("sha256", secret).update(JSON.stringify(receipt)).digest("base64url");
}
