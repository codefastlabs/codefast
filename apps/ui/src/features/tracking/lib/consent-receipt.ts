import type { ConsentReceiptInput } from "@codefast/tracking";
import type { ReceiptStore } from "@codefast/tracking/server";
import { createInMemoryReceiptStore } from "@codefast/tracking/server";
import { recordConsentReceiptFromRequest } from "@codefast/tracking/tanstack-start";
import { createServerFn } from "@tanstack/react-start";

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
 * body-supplied IP, coarsens the connection IP, appends append-only, and stamps
 * `cache-control: no-store`.
 */
export const recordConsentReceipt = createServerFn({ method: "POST" })
  .validator((data: ConsentReceiptInput) => data)
  .handler(({ data }) => {
    receiptStore ??= createInMemoryReceiptStore();

    return recordConsentReceiptFromRequest({ input: data, store: receiptStore });
  });
