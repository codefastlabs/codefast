/** The place-order CLI command — a second driving adapter over the same checkout use case. */

import { inject, injectable, token } from "@codefast/di";

import type { PlaceOrder } from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order";
import { PlaceOrderToken } from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order";
import type { PlaceOrderLine } from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order.dto";

/** Drives the place-order use case from the command line — proof the use case is transport-agnostic. */
@injectable([inject(PlaceOrderToken)])
export class PlaceOrderCommandCli {
  constructor(private readonly placeOrder: PlaceOrder) {}

  /** Runs the command for `customerEmail`, paying in `currency` for `items`. */
  async run(customerEmail: string, currency: string, items: ReadonlyArray<PlaceOrderLine>): Promise<void> {
    const result = await this.placeOrder.execute({ customerEmail, currency, items });

    console.log(`    [cli] order ${result.orderId} → ${result.status} (${result.total}, payment ${result.paymentId})`);
  }
}

/** Injection token for the place-order CLI command. */
export const PlaceOrderCommandCliToken = token<PlaceOrderCommandCli>("PlaceOrderCommandCli");
