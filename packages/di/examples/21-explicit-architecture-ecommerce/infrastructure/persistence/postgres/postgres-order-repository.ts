/** An `OrderRepository` adapter that talks to the mock `PgPool` while storing rows in memory. */

import { inject, injectable } from "@codefast/di";

import type { OrderRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/order-repository";
import type { Order } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import { PgPoolToken } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/pg-pool";
import type { PgPool } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/pg-pool";

/** Persists orders through Postgres SQL; the mock pool logs each statement and an in-memory map holds the rows. */
@injectable([inject(PgPoolToken)])
export class PostgresOrderRepository implements OrderRepository {
  readonly #store = new Map<OrderId, Order>();

  constructor(private readonly pool: PgPool) {}

  async findById(id: OrderId): Promise<Order | undefined> {
    await this.pool.query("SELECT * FROM orders WHERE id = $1", [id]);

    return this.#store.get(id);
  }

  async save(order: Order): Promise<void> {
    await this.pool.query("INSERT INTO orders (id, total, status) VALUES ($1, $2, $3)", [order.id]);
    this.#store.set(order.id, order);
  }
}
