/** The outbound port through which the application persists and reloads orders. */

import { token } from "@codefast/di";

import type { Order } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";

/** Persists and retrieves `Order` aggregates. */
export interface OrderRepository {
  /** The order with `id`, or `undefined` when none is stored. */
  findById(id: OrderId): Promise<Order | undefined>;

  /** Persists the current state of `order`. */
  save(order: Order): Promise<void>;
}

/** The injection token that binds the `OrderRepository` port to its adapter. */
export const OrderRepositoryToken = token<OrderRepository>("OrderRepository");
