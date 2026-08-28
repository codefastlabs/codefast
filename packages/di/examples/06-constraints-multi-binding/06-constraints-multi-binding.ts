/**
 * Example 06 — Constraints & Multi-binding
 *
 * Shows how to:
 * - Register multiple bindings for the same token
 * - Select a specific binding with named / tagged hints
 * - Apply custom constraint predicates (whenParentIs)
 * - Collect all bindings with resolveAll
 */

import { Container, inject, injectable, token, whenParentIs } from "@codefast/di";

import { tag } from "#/core/tag";
import { item, section } from "#/examples/support/log";

const PROVIDER_TAG = tag<"local" | "s3">("provider");

// ── Tokens ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const LoggerToken = token<Logger>("Logger");
const PaymentLoggerToken = token<Logger>("PaymentLogger");
const StorageToken = token<Storage>("Storage");
const S3StorageToken = token<Storage>("S3Storage");
const LocalStorageToken = token<Storage>("LocalStorage");
const EventHandlerToken = token<EventHandler>("EventHandler");
const OrderServiceToken = token<OrderService>("OrderService");
const PaymentServiceToken = token<PaymentService>("PaymentService");

// ── Interfaces ───────────────────────────────────────────────────────────────────────────────────────────────────────

interface Logger {
  source: string;
  log(message: string): void;
}

interface Storage {
  provider: string;
  write(key: string, data: string): void;
  read(key: string): string | undefined;
}

interface EventHandler {
  name: string;
  handle(event: string): void;
}

interface OrderService {
  createOrder(id: string): void;
}

interface PaymentService {
  processPayment(orderId: string): void;
}

// ── Named bindings ───────────────────────────────────────────────────────────────────────────────────────────────────
// Use inject(token, { name }) / container.resolve(token, { name })

const consoleLogger: Logger = {
  source: "console",
  log: (message) => console.log(`[console] ${message}`),
};

const fileLogger: Logger = {
  source: "file",
  log: (message) => console.log(`[file] writing: ${message}`),
};

const silentLogger: Logger = {
  source: "silent",
  log: () => {
    /* noop */
  },
};

// ── Tagged bindings ──────────────────────────────────────────────────────────────────────────────────────────────────

class S3Storage implements Storage {
  provider = "s3";
  #store = new Map<string, string>();
  write(key: string, data: string): void {
    this.#store.set(key, data);
    console.log(`[S3] wrote ${key}`);
  }
  read(key: string): string | undefined {
    return this.#store.get(key);
  }
}

class LocalStorage implements Storage {
  provider = "local";
  #store = new Map<string, string>();
  write(key: string, data: string): void {
    this.#store.set(key, data);
    console.log(`[Local] wrote ${key}`);
  }
  read(key: string): string | undefined {
    return this.#store.get(key);
  }
}

// ── Constraint-aware dependencies ────────────────────────────────────────────────────────────────────────────────────
// OrderService uses a parent-aware constraint; PaymentService uses a dedicated logger token.

@injectable([inject(LoggerToken), inject(S3StorageToken)])
class OrderManager implements OrderService {
  constructor(
    private readonly logger: Logger,
    private readonly storage: Storage,
  ) {
    logger.log(`OrderService initialized (logger: ${logger.source})`);
  }

  createOrder(id: string): void {
    this.logger.log(`creating order ${id}`);
    this.storage.write(`order:${id}`, JSON.stringify({ id, status: "pending" }));
  }
}

@injectable([inject(PaymentLoggerToken), inject(LocalStorageToken)])
class PaymentProcessor implements PaymentService {
  constructor(
    private readonly logger: Logger,
    private readonly storage: Storage,
  ) {
    logger.log(`PaymentService initialized (logger: ${logger.source})`);
  }

  processPayment(orderId: string): void {
    this.logger.log(`processing payment for ${orderId}`);
    this.storage.write(`payment:${orderId}`, JSON.stringify({ status: "charged" }));
  }
}

// ── Multi-binding (event handlers) ───────────────────────────────────────────────────────────────────────────────────

class LogEventHandler implements EventHandler {
  name = "log";
  handle(event: string): void {
    console.log(`[LogHandler] ${event}`);
  }
}

class MetricsEventHandler implements EventHandler {
  name = "metrics";
  handle(event: string): void {
    console.log(`[MetricsHandler] recording: ${event}`);
  }
}

class AlertEventHandler implements EventHandler {
  name = "alert";
  handle(event: string): void {
    console.log(`[AlertHandler] ALERT: ${event}`);
  }
}

// ── Container setup ──────────────────────────────────────────────────────────────────────────────────────────────────

const namedContainer = Container.create();

// Named loggers
namedContainer.bind(LoggerToken).toConstantValue(consoleLogger).whenNamed("console");
namedContainer.bind(LoggerToken).toConstantValue(fileLogger).whenNamed("file");
namedContainer.bind(LoggerToken).toConstantValue(silentLogger).whenNamed("silent");

const appContainer = Container.create();

// Constraint-based: OrderService gets console logger
appContainer.bind(LoggerToken).toConstantValue(consoleLogger).when(whenParentIs(OrderServiceToken));

// PaymentService uses a dedicated logger token to avoid ambiguity.
appContainer.bind(PaymentLoggerToken).toConstantValue(fileLogger);

// Tagged storages
appContainer.bind(StorageToken).to(S3Storage).whenTagged(PROVIDER_TAG.of("s3")).singleton();
appContainer.bind(StorageToken).to(LocalStorage).whenTagged(PROVIDER_TAG.of("local")).singleton();
appContainer.bind(S3StorageToken).to(S3Storage).singleton();
appContainer.bind(LocalStorageToken).to(LocalStorage).singleton();

// Services (OrderService uses constraint-based logger selection above)
appContainer.bind(OrderServiceToken).to(OrderManager).singleton();
appContainer.bind(PaymentServiceToken).to(PaymentProcessor).singleton();

// Multi-binding: three handlers under the same token
appContainer.bind(EventHandlerToken).to(LogEventHandler).whenNamed("log");
appContainer.bind(EventHandlerToken).to(MetricsEventHandler).whenNamed("metrics");
appContainer.bind(EventHandlerToken).to(AlertEventHandler).whenNamed("alert");

// ── Usage ────────────────────────────────────────────────────────────────────────────────────────────────────────────

section("Named bindings");
const consoleLoggerInstance = namedContainer.resolve(LoggerToken, { name: "console" });
const fileLoggerInstance = namedContainer.resolve(LoggerToken, { name: "file" });
consoleLoggerInstance.log("hello from console");
fileLoggerInstance.log("hello from file");

section("Tagged bindings");
const s3Storage = appContainer.resolve(StorageToken, { tags: [PROVIDER_TAG.of("s3")] });
const localStorageInstance = appContainer.resolve(StorageToken, { tags: [PROVIDER_TAG.of("local")] });
item("s3Storage.provider", s3Storage.provider);
item("localStorage.provider", localStorageInstance.provider);

section("Constraint-based (parent-aware)");
const orderService = appContainer.resolve(OrderServiceToken);
orderService.createOrder("ORD-1");

const paymentService = appContainer.resolve(PaymentServiceToken);
paymentService.processPayment("ORD-1");

section("Multi-binding");
const eventHandlers = appContainer.resolveAll(EventHandlerToken);
console.log(`Resolved ${eventHandlers.length} handlers`);

const eventName = "order.created";
for (const eventHandler of eventHandlers) {
  eventHandler.handle(eventName);
}
