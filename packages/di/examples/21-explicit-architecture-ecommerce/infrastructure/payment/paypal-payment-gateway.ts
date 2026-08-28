/** A `PaymentGateway` adapter charging PayPal — a runnable mock, not a real API client. */

import type { PaymentGateway } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import type { PaymentIntent } from "#/examples/21-explicit-architecture-ecommerce/domain/payment/payment-intent";
import type { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";

/** Settles USD and EUR; captures immediately and returns a `pp_*` intent. */
export class PayPalPaymentGateway implements PaymentGateway {
  readonly name = "paypal";

  #seq = 0;

  constructor(private readonly clientId: string) {}

  supports(currency: string): boolean {
    return ["USD", "EUR"].includes(currency);
  }

  async charge(orderId: OrderId, amount: Money): Promise<PaymentIntent> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    this.#seq += 1;
    console.log(`    [paypal] charge ${amount.toString()} for ${orderId} (client ${this.clientId.slice(0, 8)}…)`);

    return {
      id: `pp_${String(this.#seq).padStart(6, "0")}`,
      orderId,
      amount,
      gateway: this.name,
      status: "captured",
    };
  }
}
