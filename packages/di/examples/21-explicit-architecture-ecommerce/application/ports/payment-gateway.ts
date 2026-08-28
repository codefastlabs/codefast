/** The outbound port for charging a payment provider — one adapter per provider. */

import { token } from "@codefast/di";

import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import type { PaymentIntent } from "#/examples/21-explicit-architecture-ecommerce/domain/payment/payment-intent";
import type { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";

/** Authorizes and captures a charge; the selector picks one by the currency it `supports`. */
export interface PaymentGateway {
  /** The provider name, e.g. `stripe`. */
  readonly name: string;

  /** Whether this gateway can settle `currency`. */
  supports(currency: string): boolean;

  /** Charges `amount` for `orderId`, returning the resulting intent. */
  charge(orderId: OrderId, amount: Money): Promise<PaymentIntent>;
}

/** The injection token that binds the `PaymentGateway` port to its adapters. */
export const PaymentGatewayToken = token<PaymentGateway>("PaymentGateway");
