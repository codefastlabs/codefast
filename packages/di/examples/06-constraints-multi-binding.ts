/**
 * Example 06 — Constraints & Multi-binding
 *
 * Shows how to:
 * - Register multiple bindings for the same token
 * - Select a specific binding with named / tagged hints
 * - Apply custom constraint predicates (whenParentIs)
 * - Collect all bindings with resolveAll
 */

import { Container, inject, injectable, singleton, token } from "@codefast/di";
import { whenParentIs } from "@codefast/di/constraints";

// --- Tokens -----------------------------------------------------------------

const LoggerToken = token<Logger>("Logger");
const PaymentLoggerToken = token<Logger>("PaymentLogger");
const StorageToken = token<Storage>("Storage");
const S3StorageToken = token<Storage>("S3Storage");
const LocalStorageToken = token<Storage>("LocalStorage");
const EventHandlerToken = token<EventHandler>("EventHandler");
const OrderServiceToken = token<OrderService>("OrderService");
const PaymentServiceToken = token<PaymentService>("PaymentService");

// --- Interfaces -------------------------------------------------------------

interface Logger {
  source: string;
  log(msg: string): void;
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

// --- Named bindings ---------------------------------------------------------
// Use inject(token, { name }) / container.resolve(token, { name })

const consoleLogger: Logger = {
  source: "console",
  log: (msg) => console.log(`[console] ${msg}`),
};

const fileLogger: Logger = {
  source: "file",
  log: (msg) => console.log(`[file] writing: ${msg}`),
};

const silentLogger: Logger = {
  source: "silent",
  log: () => {
    /* noop */
  },
};

// --- Tagged bindings --------------------------------------------------------

class S3Storage implements Storage {
  provider = "s3";
  private store = new Map<string, string>();
  write(key: string, data: string): void {
    this.store.set(key, data);
    console.log(`[S3] wrote ${key}`);
  }
  read(key: string): string | undefined {
    return this.store.get(key);
  }
}

class LocalStorage implements Storage {
  provider = "local";
  private store = new Map<string, string>();
  write(key: string, data: string): void {
    this.store.set(key, data);
    console.log(`[Local] wrote ${key}`);
  }
  read(key: string): string | undefined {
    return this.store.get(key);
  }
}

// --- Constraint-aware dependencies ------------------------------------------
// OrderService uses parent-aware constraint; PaymentService uses named hint.

@injectable([inject(LoggerToken), inject(S3StorageToken)])
@singleton()
class OrderService {
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
@singleton()
class PaymentService {
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

// --- Multi-binding (event handlers) -----------------------------------------

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

// --- Container setup --------------------------------------------------------

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
appContainer.bind(StorageToken).to(S3Storage).whenTagged("provider", "s3").singleton();
appContainer.bind(StorageToken).to(LocalStorage).whenTagged("provider", "local").singleton();
appContainer.bind(S3StorageToken).to(S3Storage).singleton();
appContainer.bind(LocalStorageToken).to(LocalStorage).singleton();

// Services (OrderService uses constraint-based logger selection above)
appContainer.bind(OrderServiceToken).to(OrderService);
appContainer.bind(PaymentServiceToken).to(PaymentService);

// Multi-binding: three handlers under the same token
appContainer.bind(EventHandlerToken).to(LogEventHandler);
appContainer.bind(EventHandlerToken).to(MetricsEventHandler);
appContainer.bind(EventHandlerToken).to(AlertEventHandler);

// --- Usage ------------------------------------------------------------------

console.log("=== Named bindings ===");
const consoleLoggerInstance = namedContainer.resolve(LoggerToken, { name: "console" });
const fileLoggerInstance = namedContainer.resolve(LoggerToken, { name: "file" });
consoleLoggerInstance.log("hello from console");
fileLoggerInstance.log("hello from file");

console.log("\n=== Tagged bindings ===");
const s3Storage = appContainer.resolve(StorageToken, { tag: ["provider", "s3"] });
const localStorageInstance = appContainer.resolve(StorageToken, { tag: ["provider", "local"] });
console.log("s3Storage.provider:", s3Storage.provider);
console.log("localStorage.provider:", localStorageInstance.provider);

console.log("\n=== Constraint-based (parent-aware) ===");
const orders = appContainer.resolve(OrderServiceToken);
orders.createOrder("ORD-1");

const payments = appContainer.resolve(PaymentServiceToken);
payments.processPayment("ORD-1");

console.log("\n=== Multi-binding ===");
const handlers = appContainer.resolveAll(EventHandlerToken);
console.log(`Resolved ${handlers.length} handlers`);

const testEvent = "order.created";
for (const handler of handlers) {
  handler.handle(testEvent);
}
