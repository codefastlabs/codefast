/** The `PlaceOrder` use case — the checkout orchestration across every outbound port. */

import { inject, injectAll, injectable, token } from "@codefast/di";

import type {
  PlaceOrderCommand,
  PlaceOrderResult,
} from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order.dto";
import { ClockToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/clock";
import type { Clock } from "#/examples/21-explicit-architecture-ecommerce/application/ports/clock";
import { IdGeneratorToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/id-generator";
import type { IdGenerator } from "#/examples/21-explicit-architecture-ecommerce/application/ports/id-generator";
import { NotificationSenderToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/notification-sender";
import type { NotificationSender } from "#/examples/21-explicit-architecture-ecommerce/application/ports/notification-sender";
import { OrderRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/order-repository";
import type { OrderRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/order-repository";
import { PaymentGatewayToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import type { PaymentGateway } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import { ProductRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import type { ProductRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import { UnitOfWorkToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/unit-of-work";
import type { UnitOfWork } from "#/examples/21-explicit-architecture-ecommerce/application/ports/unit-of-work";
import {
  PaymentDeclinedError,
  UnsupportedCurrencyError,
} from "#/examples/21-explicit-architecture-ecommerce/application/shared/application-errors";
import { ProductNotFoundError } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/catalog-errors";
import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import { toProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";
import { Order } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order";
import type { OrderLine } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order";
import { toOrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";

/** Reserves stock, prices the order, charges a gateway, persists atomically, and notifies the customer. */
@injectable([
  inject(ProductRepositoryToken),
  inject(OrderRepositoryToken),
  injectAll(PaymentGatewayToken),
  injectAll(NotificationSenderToken),
  inject(ClockToken),
  inject(IdGeneratorToken),
  inject(UnitOfWorkToken),
])
export class PlaceOrder {
  constructor(
    private readonly products: ProductRepository,
    private readonly orders: OrderRepository,
    private readonly gateways: ReadonlyArray<PaymentGateway>,
    private readonly notifiers: ReadonlyArray<NotificationSender>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    const reserved: Array<Product> = [];
    const lines: Array<OrderLine> = [];

    for (const item of command.items) {
      const product = await this.products.findById(toProductId(item.productId));

      if (product === undefined) {
        throw new ProductNotFoundError(item.productId);
      }

      product.reserve(item.quantity);
      reserved.push(product);
      lines.push({ productId: product.id, quantity: item.quantity, unitPrice: product.unitPrice });
    }

    const order = Order.place(toOrderId(this.ids.next("order_")), lines, this.clock.now());

    const gateway = this.gateways.find((candidate) => candidate.supports(command.currency));

    if (gateway === undefined) {
      throw new UnsupportedCurrencyError(command.currency);
    }

    const payment = await gateway.charge(order.id, order.total);

    if (payment.status === "failed") {
      throw new PaymentDeclinedError(order.id);
    }

    order.markPaid(this.clock.now());

    // One transaction covers both the order and the decremented stock.
    await this.unitOfWork.run(async () => {
      await this.orders.save(order);

      for (const product of reserved) {
        await this.products.save(product);
      }
    });

    const message = `Order ${order.id} is ${order.status} — total ${order.total.toString()}`;
    await Promise.all(this.notifiers.map((notifier) => notifier.send(command.customerEmail, message)));

    return { orderId: order.id, total: order.total.toString(), paymentId: payment.id, status: order.status };
  }
}

/** The injection token that resolves the `PlaceOrder` use case. */
export const PlaceOrderToken = token<PlaceOrder>("PlaceOrder");
