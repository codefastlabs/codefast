/**
 * Example 03 — Scopes & Child Containers
 *
 * Compares singleton / transient / scoped lifetimes.
 * Scoped bindings require a child container — perfect for per-request
 * or per-session isolation in a server context.
 */

import { Container, inject, injectable, token } from "@codefast/di";

// --- Tokens -----------------------------------------------------------------

const AppDbToken = token<AppDatabase>("AppDatabase");
const RequestContextToken = token<RequestContext>("RequestContext");
const RequestLoggerToken = token<RequestLogger>("RequestLogger");
const HandlerToken = token<RequestHandler>("RequestHandler");

// --- Domain types -----------------------------------------------------------

interface RequestContext {
  requestId: string;
  userId: string;
}

// Singleton — shared across all requests
@injectable()
class AppDatabase {
  private static instanceCount = 0;
  readonly instanceId: number;

  constructor() {
    this.instanceId = ++AppDatabase.instanceCount;
    console.log(`[AppDatabase] instance #${this.instanceId} created`);
  }

  query(sql: string): string {
    return `Result of "${sql}" from db#${this.instanceId}`;
  }
}

// Scoped — one per child container (i.e., one per request)
@injectable([inject(RequestContextToken)])
class RequestLogger {
  constructor(private readonly requestContext: RequestContext) {
    console.log(`[RequestLogger] created for request ${requestContext.requestId}`);
  }

  log(msg: string): void {
    console.log(`[${this.requestContext.requestId}/${this.requestContext.userId}] ${msg}`);
  }
}

// Transient — new instance on every resolution
class RequestHandler {
  private static instanceCount = 0;
  readonly instanceId: number;

  constructor(
    private readonly database: AppDatabase,
    private readonly logger: RequestLogger,
  ) {
    this.instanceId = ++RequestHandler.instanceCount;
  }

  handle(query: string): string {
    this.logger.log(`handling: ${query}`);
    return this.database.query(query);
  }
}

// --- Root container (app-level singletons) ----------------------------------

const rootContainer = Container.create();

rootContainer.bind(AppDbToken).to(AppDatabase).singleton();
rootContainer.bind(RequestContextToken).toConstantValue({
  requestId: "bootstrap",
  userId: "system",
});
rootContainer.bind(RequestLoggerToken).to(RequestLogger).scoped();

// HandlerToken is explicitly transient — new per resolution
rootContainer
  .bind(HandlerToken)
  .toDynamic((ctx) => {
    const database = ctx.resolve(AppDbToken);
    const logger = ctx.resolve(RequestLoggerToken);
    return new RequestHandler(database, logger);
  })
  .transient();

// --- Simulate two HTTP requests --------------------------------------------

function handleRequest(requestId: string, userId: string, query: string): void {
  // Each request gets its own child container — scoped bindings are isolated
  const requestContainer = rootContainer.createChild();

  requestContainer.bind(RequestContextToken).toConstantValue({ requestId, userId }); // constant is per-child by construction

  const handler = requestContainer.resolve(HandlerToken);
  const result = handler.handle(query);

  console.log("Result:", result);

  // Re-resolve within the same request scope — scoped instances are reused
  const secondHandlerResolve = requestContainer.resolve(HandlerToken);
  console.log("Same Handler instance:", handler === secondHandlerResolve); // true
  const firstLoggerResolve = requestContainer.resolve(RequestLoggerToken);
  const secondLoggerResolve = requestContainer.resolve(RequestLoggerToken);
  console.log("Same RequestLogger instance:", firstLoggerResolve === secondLoggerResolve); // true
}

console.log("=== Request A ===");
handleRequest("req-001", "user-42", "SELECT * FROM orders");

console.log("\n=== Request B ===");
handleRequest("req-002", "user-99", "SELECT * FROM products");

// AppDatabase was only ever created once (singleton across all requests)
const firstDatabaseResolve = rootContainer.resolve(AppDbToken);
const secondDatabaseResolve = rootContainer.resolve(AppDbToken);
console.log("\nSame AppDatabase instance:", firstDatabaseResolve === secondDatabaseResolve); // true
console.log("Database instanceId:", firstDatabaseResolve.instanceId); // 1
