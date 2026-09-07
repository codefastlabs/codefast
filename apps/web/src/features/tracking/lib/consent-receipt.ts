import { recordConsentReceiptFromRequest } from "@codefast/tracking/adapters/tanstack-start";
import type { ConsentReceiptInput } from "@codefast/tracking/core/consent-receipt";
import type { ReceiptStore } from "@codefast/tracking/server/consent-receipt-store";
import { createInMemoryReceiptStore } from "@codefast/tracking/server/consent-receipt-store";
import { createServerFn } from "@tanstack/react-start";

import { forwardConsentDecisionToGa4 } from "#/features/tracking/lib/ga4-measurement-protocol.server";
import { createReceiptSigner } from "#/features/tracking/lib/receipt-signer.server";

/**
 * Dev-only in-memory receipt store — a production deployment swaps in a durable backend (a
 * database or append-only log). Created lazily **inside the handler**, never at module scope,
 * so the server-only import is referenced only in code the Start compiler strips from the
 * client transform (a module-scoped call would trip `importProtection`). One store per process.
 */
let receiptStore: ReceiptStore | undefined;

/**
 * Records the visitor's consent decision as a server-side receipt — the demonstrable-consent
 * proof the tamperable client `ConsentRecord` cannot be. The package helper rejects a
 * body-supplied IP, coarsens the connection IP, appends append-only, stamps a tamper-evidence
 * `integrityKey` when `CONSENT_RECEIPT_SECRET` is set, and stamps `cache-control: no-store`.
 * When analytics consent and MP credentials are present, the decision is also forwarded to
 * GA4 as a server-owned event.
 */
export const recordConsentReceipt = createServerFn({ method: "POST" })
  .validator((data: ConsentReceiptInput) => data)
  .handler(async ({ data }) => {
    receiptStore ??= createInMemoryReceiptStore();

    // Signer built inside the handler (like the store) so the server-only import stays in
    // code the Start compiler strips from the client transform.
    const ack = await recordConsentReceiptFromRequest({
      input: data,
      store: receiptStore,
      sign: createReceiptSigner(),
    });

    // Forward the decision to GA4 as a server-owned event — awaited so it completes before
    // the serverless function freezes, but its failure must never break the receipt write.
    try {
      await forwardConsentDecisionToGa4(data);
    } catch {
      /* the GA4 forward is best-effort — the recorded receipt is the source of truth */
    }

    return ack;
  });
