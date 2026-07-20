import type { ConsentReceipt } from "#/core/consent-receipt";

/**
 * Persistence backend for consent receipts — the durable store is the consumer's to supply
 * (a database, an append-only log). The store is **append-only**: `append` never overwrites,
 * and an update/withdrawal is a new receipt referencing the prior one (spec-consent-receipts §3).
 * May be async so a real backend can await its write.
 *
 * @since 1.0.0-canary.7
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
 *
 * @since 1.0.0-canary.7
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

/**
 * The minimal id-keyed primitive a durable backend must expose for {@link createDurableReceiptStore}.
 * Keeping it this small lets an integrator back receipts with any store (Vercel KV, Postgres,
 * an append-only log) by implementing two methods rather than the full {@link ReceiptStore}.
 *
 * @since 1.0.0-canary.7
 */
export interface ReceiptStoreBackend {
  get: (receiptId: string) => Promise<ConsentReceipt | undefined>;
  /**
   * Persist one receipt under its id. MUST be idempotent-by-id and never overwrite — a
   * duplicate `receiptId` is a no-op — so the append-only guarantee holds atomically even
   * under a client retry or concurrent write (e.g. KV set-if-absent, Postgres
   * `INSERT … ON CONFLICT DO NOTHING`). The frame delegates rather than doing a racy
   * get-then-put itself.
   */
  put: (receiptId: string, receipt: ConsentReceipt) => Promise<void>;
}

/**
 * A durable {@link ReceiptStore} over an injected {@link ReceiptStoreBackend} — the package
 * supplies the append-only contract and adaptation, the deployment supplies the backend
 * client (no database dependency is baked in). Pair it with a real backend in production,
 * where {@link createInMemoryReceiptStore} is not a lawful store on its own.
 *
 * @since 1.0.0-canary.7
 */
export function createDurableReceiptStore(options: { backend: ReceiptStoreBackend }): ReceiptStore {
  return {
    async append(receipt: ConsentReceipt): Promise<void> {
      await options.backend.put(receipt.receiptId, receipt);
    },
    async get(receiptId: string): Promise<ConsentReceipt | undefined> {
      return options.backend.get(receiptId);
    },
  };
}
