/** The `Order` aggregate — owns its total, its lifecycle state, and the events it emits. */

import type { ProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import type { OrderStatus } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-status";
import { DomainError } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/domain-error";
import type { DomainEvent } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/domain-event";
import type { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";

/** One priced line of an order. */
export interface OrderLine {
  readonly productId: ProductId;
  readonly quantity: number;
  readonly unitPrice: Money;
}

/** A customer order; its total is derived at creation and its status only advances through guarded methods. */
export class Order {
  #status: OrderStatus = "pending";
  readonly #events: Array<DomainEvent> = [];

  private constructor(
    readonly id: OrderId,
    readonly lines: ReadonlyArray<OrderLine>,
    readonly total: Money,
    at: Date,
  ) {
    this.#events.push({ type: "OrderPlaced", occurredAt: at });
  }

  /** Places an order from at least one line, deriving the total from the lines. */
  static place(id: OrderId, lines: ReadonlyArray<OrderLine>, at: Date): Order {
    const [first, ...rest] = lines;

    if (first === undefined) {
      throw new DomainError("EMPTY_ORDER", "An order needs at least one line");
    }

    const total = rest.reduce(
      (sum, line) => sum.add(line.unitPrice.multiply(line.quantity)),
      first.unitPrice.multiply(first.quantity),
    );

    return new Order(id, lines, total, at);
  }

  /** The current lifecycle state. */
  get status(): OrderStatus {
    return this.#status;
  }

  /** Advances a pending order to paid, refusing any other transition. */
  markPaid(at: Date): void {
    if (this.#status !== "pending") {
      throw new DomainError("INVALID_ORDER_STATE", `Order ${this.id} is ${this.#status}, cannot mark paid`);
    }

    this.#status = "paid";
    this.#events.push({ type: "OrderPaid", occurredAt: at });
  }

  /** Returns the events recorded since the last pull, then clears them. */
  pullEvents(): ReadonlyArray<DomainEvent> {
    const events = [...this.#events];
    this.#events.length = 0;

    return events;
  }
}
