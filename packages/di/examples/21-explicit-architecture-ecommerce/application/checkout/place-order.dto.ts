/** The command and result shapes crossing the checkout use case's boundary. */

// ── Command ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** One requested line of a checkout. */
export interface PlaceOrderLine {
  readonly productId: string;
  readonly quantity: number;
}

/** Instruction to place an order for a customer. */
export interface PlaceOrderCommand {
  readonly customerEmail: string;
  readonly currency: string;
  readonly items: ReadonlyArray<PlaceOrderLine>;
}

// ── Result ───────────────────────────────────────────────────────────────────────────────────────────────────────────

/** The outcome returned to the caller once an order is placed and paid. */
export interface PlaceOrderResult {
  readonly orderId: string;
  readonly total: string;
  readonly paymentId: string;
  readonly status: string;
}
