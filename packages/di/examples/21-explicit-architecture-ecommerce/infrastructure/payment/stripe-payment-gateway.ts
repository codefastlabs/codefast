/** A `PaymentGateway` adapter charging Stripe — a runnable mock, not a real API client. */

import type { PaymentGateway } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import type { PaymentIntent } from "#/examples/21-explicit-architecture-ecommerce/domain/payment/payment-intent";
import type { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";

/** Settles USD, EUR, and GBP; captures immediately and returns a `pi_stripe_*` intent. */
export class StripePaymentGateway implements PaymentGateway {
  readonly name = "stripe";

  #seq = 0;

  constructor(private readonly apiKey: string) {}

  supports(currency: string): boolean {
    return ["USD", "EUR", "GBP"].includes(currency);
  }

  async charge(orderId: OrderId, amount: Money): Promise<PaymentIntent> {
    await new Promise((resolve) => setTimeout(resolve, 15));
    this.#seq += 1;
    console.log(`    [stripe] charge ${amount.toString()} for ${orderId}`);

    return {
      id: `pi_stripe_${String(this.#seq).padStart(6, "0")}`,
      orderId,
      amount,
      gateway: this.name,
      status: "captured",
    };
  }
}
