/** An `OrderRepository` adapter backed by an in-memory map — the seam a real database would replace. */

import { injectable } from "@codefast/di";

import type { OrderRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/order-repository";
import type { Order } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";

/** Keeps orders in a `Map`; swap it for the Postgres adapter and no domain or use-case code changes. */
@injectable()
export class InMemoryOrderRepository implements OrderRepository {
  readonly #store = new Map<OrderId, Order>();

  async findById(id: OrderId): Promise<Order | undefined> {
    return this.#store.get(id);
  }

  async save(order: Order): Promise<void> {
    this.#store.set(order.id, order);
  }
}
