import type { ConsentReceipt } from "#/core/consent-receipt";

/**
 * Persistence backend for consent receipts — the durable store is the consumer's to supply
 * (a database, an append-only log). The store is **append-only**: `append` never overwrites,
 * and an update/withdrawal is a new receipt referencing the prior one (spec-consent-receipts §3).
 * May be async so a real backend can await its write.
 */
export interface ReceiptStore {
  append: (receipt: ConsentReceipt) => Promise<void> | void;
  get: (receiptId: string) => ConsentReceipt | undefined | Promise<ConsentReceipt | undefined>;
}

/**
 * An in-memory {@link ReceiptStore} for development and tests — **not** durable across a
 * process restart, and not a lawful production store on its own. A real deployment supplies
 * a database-backed implementation; this exists so the endpoint is runnable end-to-end
 * without standing up storage first.
 *
 * @remarks
 * Append is idempotent-by-id: re-appending the same `receiptId` is ignored, preserving the
 * append-only guarantee even if a client retries.
 */
export function createInMemoryReceiptStore(): ReceiptStore {
  const receipts = new Map<string, ConsentReceipt>();

  return {
    append(receipt: ConsentReceipt): void {
      if (!receipts.has(receipt.receiptId)) {
        receipts.set(receipt.receiptId, receipt);
      }
    },
    get(receiptId: string): ConsentReceipt | undefined {
      return receipts.get(receiptId);
    },
  };
}
