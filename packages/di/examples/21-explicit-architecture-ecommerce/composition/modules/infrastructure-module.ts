/** The infrastructure module — the container auto-wires each adapter; config decides which at compose time. */

import { Module } from "@codefast/di";

import { ClockToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/clock";
import { IdGeneratorToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/id-generator";
import { NotificationSenderToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/notification-sender";
import { OrderRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/order-repository";
import { PaymentGatewayToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import { ProductRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import { UnitOfWorkToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/unit-of-work";
import { loadEnvConfig } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/config/env-config";
import { EmailNotificationSender } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/notification/email-notification-sender";
import { SmsNotificationSender } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/notification/sms-notification-sender";
import { PayPalPaymentGateway } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/payment/paypal-payment-gateway";
import { StripePaymentGateway } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/payment/stripe-payment-gateway";
import { InMemoryOrderRepository } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/in-memory/in-memory-order-repository";
import { InMemoryProductRepository } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/in-memory/in-memory-product-repository";
import { InMemoryUnitOfWork } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/in-memory/in-memory-unit-of-work";
import {
  PgPool,
  PgPoolToken,
} from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/pg-pool";
import { PostgresOrderRepository } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/postgres-order-repository";
import { PostgresProductRepository } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/postgres-product-repository";
import { SystemClock } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/system/system-clock";
import { UuidIdGenerator } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/system/uuid-id-generator";
import { RequestContextToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/middleware/request-context";

// Config is a composition-time value, read once — never resolved from the container at runtime.
const config = loadEnvConfig();

/** Auto-wires the decorated adapters with `.to()`; config picks the repository, and gateway secrets are read here. */
export const infrastructureModule = Module.create("Infrastructure", (builder) => {
  builder.bind(ClockToken).to(SystemClock).singleton();
  builder.bind(IdGeneratorToken).to(UuidIdGenerator).singleton();
  builder.bind(UnitOfWorkToken).to(InMemoryUnitOfWork).singleton();

  // The choice is made at compose time; the container still constructs and injects the chosen adapter.
  if (config.database === "postgres") {
    builder.bind(PgPoolToken).toConstantValue(new PgPool(config.postgresUrl));
    builder.bind(ProductRepositoryToken).to(PostgresProductRepository).singleton();
    builder.bind(OrderRepositoryToken).to(PostgresOrderRepository).singleton();
  } else {
    builder.bind(ProductRepositoryToken).to(InMemoryProductRepository).singleton();
    builder.bind(OrderRepositoryToken).to(InMemoryOrderRepository).singleton();
  }

  // A gateway needs a config secret, so its instance is built here — one named slot per provider.
  builder.bind(PaymentGatewayToken).toConstantValue(new StripePaymentGateway(config.stripeKey)).whenNamed("stripe");
  builder
    .bind(PaymentGatewayToken)
    .toConstantValue(new PayPalPaymentGateway(config.paypalClientId))
    .whenNamed("paypal");

  builder.bind(NotificationSenderToken).to(EmailNotificationSender).whenNamed("email").singleton();
  builder.bind(NotificationSenderToken).to(SmsNotificationSender).whenNamed("sms").singleton();

  builder
    .bind(RequestContextToken)
    .toDynamic((ctx) => ({ correlationId: ctx.resolve(IdGeneratorToken).next("req_") }))
    .scoped();
});
