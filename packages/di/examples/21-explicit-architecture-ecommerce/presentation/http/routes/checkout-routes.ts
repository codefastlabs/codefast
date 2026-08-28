/** The checkout HTTP route — a driving adapter that turns a request into the place-order use case. */

import { inject, injectable, token } from "@codefast/di";

import type { PlaceOrder } from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order";
import { PlaceOrderToken } from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order";
import type { PlaceOrderCommand } from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order.dto";
import type { HttpServer } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/server";

/** Binds `POST /checkout` to the place-order use case, mapping domain failures to `422`. */
@injectable([inject(PlaceOrderToken)])
export class CheckoutController {
  constructor(private readonly placeOrder: PlaceOrder) {}

  /** Registers this controller's route on `server`. */
  register(server: HttpServer): void {
    server.route("POST", "/checkout", async (request) => {
      try {
        const result = await this.placeOrder.execute(request.body as PlaceOrderCommand);

        return { status: 201, body: result };
      } catch (error) {
        const code = error instanceof Error && "code" in error ? String(error.code) : "ERROR";
        const message = error instanceof Error ? error.message : "unknown error";

        return { status: 422, body: { code, message } };
      }
    });
  }
}

/** Injection token for the checkout controller. */
export const CheckoutControllerToken = token<CheckoutController>("CheckoutController");
