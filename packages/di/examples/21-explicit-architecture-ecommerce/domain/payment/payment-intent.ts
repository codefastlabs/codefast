/** The `PaymentIntent` value object — the outcome of charging a payment gateway. */

import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import type { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";

/** Whether a charge succeeded. */
export type PaymentStatus = "captured" | "failed";

/** The record a gateway returns for one charge attempt against an order. */
export interface PaymentIntent {
  readonly id: string;
  readonly orderId: OrderId;
  readonly amount: Money;
  readonly gateway: string;
  readonly status: PaymentStatus;
}
