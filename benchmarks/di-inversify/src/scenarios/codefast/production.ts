/**
 * @codefast/di — production-shaped scenarios.
 *
 * Three archetypes drawn from real application patterns that DI containers
 * encounter in production Node.js backends:
 *
 *   - `production-http-handler` — HTTP server request pipeline.
 *     App container holds singletons (config, DB pool, logger); each
 *     simulated request creates a per-request child container that adds a
 *     trace-ID constant, a request-scoped auth context, and a transient
 *     handler service that composes all of them.  After processing the
 *     request the child container is disposed via `unbindAll()`.
 *     Measures the dominant cost in high-traffic Node.js HTTP servers.
 *
 *   - `production-unit-of-work` — Repository + Unit of Work pattern.
 *     App container holds a singleton DB-pool; each business operation
 *     creates a child container that wires a transient UoW (owns the
 *     transaction boundary), a transient repository (depends on the UoW),
 *     and a transient service (depends on the repository).  After
 *     resolution the service is called, the UoW is committed, and the
 *     child is disposed.  Typical in domain-driven backends.
 *
 *   - `production-event-bus-dispatch` — Event bus dispatcher.
 *     Eight singleton event handlers are registered at the same token
 *     using predicate-only bindings (`when(() => true)`).  Each measured
 *     iteration calls `resolveAll()` to retrieve them and then dispatches
 *     an event to each handler in turn.  Tests the full fan-out → iterate
 *     loop that real event-bus implementations pay on every published event.
 */
import { Container, token } from "@codefast/di";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ─── scenario 1: HTTP request pipeline ───────────────────────────────────────

const HTTP_HANDLER_BATCH = 50;

interface HttpConfig {
  readonly env: string;
  readonly dbUrl: string;
}

interface HttpDbPool {
  query(sql: string): string;
}

interface HttpLogger {
  info(message: string): void;
}

interface HttpAuthContext {
  readonly userId: string;
  readonly role: string;
}

interface HttpHandler {
  process(): string;
}

const httpConfigToken = token<HttpConfig>("bench-cf-prod-http-config");
const httpDbPoolToken = token<HttpDbPool>("bench-cf-prod-http-db-pool");
const httpLoggerToken = token<HttpLogger>("bench-cf-prod-http-logger");
const httpTraceIdToken = token<string>("bench-cf-prod-http-trace-id");
const httpAuthContextToken = token<HttpAuthContext>("bench-cf-prod-http-auth-context");
const httpHandlerToken = token<HttpHandler>("bench-cf-prod-http-handler");

function buildProductionHttpHandlerScenario(): BenchScenario {
  const appContainer = Container.create();

  appContainer
    .bind(httpConfigToken)
    .toDynamic(() => ({ env: "production", dbUrl: "postgres://localhost/app" }))
    .singleton();

  appContainer
    .bind(httpDbPoolToken)
    .toDynamic((ctx) => {
      const config = ctx.resolve(httpConfigToken);
      return { query: (sql: string) => `${config.dbUrl}:${sql}` };
    })
    .singleton();

  appContainer
    .bind(httpLoggerToken)
    .toDynamic(() => ({ info: (_message: string) => undefined }))
    .singleton();

  function simulateRequest(requestIndex: number): string {
    const requestChild = appContainer.createChild();

    requestChild.bind(httpTraceIdToken).toConstantValue(`trace-${String(requestIndex)}`);

    requestChild
      .bind(httpAuthContextToken)
      .toDynamic((ctx) => {
        const traceId = ctx.resolve(httpTraceIdToken);
        return { userId: `user-${traceId}`, role: "admin" };
      })
      .transient();

    requestChild
      .bind(httpHandlerToken)
      .toDynamic((ctx) => {
        const db = ctx.resolve(httpDbPoolToken);
        const logger = ctx.resolve(httpLoggerToken);
        const auth = ctx.resolve(httpAuthContextToken);
        return {
          process: () => {
            logger.info(`[${auth.userId}] handling`);
            return db.query(`SELECT * FROM users WHERE id='${auth.userId}'`);
          },
        };
      })
      .transient();

    const handler = requestChild.resolve(httpHandlerToken);
    const result = handler.process();
    requestChild.unbindAll();
    return result;
  }

  // Pre-warm app-level singletons.
  simulateRequest(0);

  return {
    id: "production-http-handler",
    group: "production",
    what: "per-request child container: trace ID + auth context + handler resolve then dispose",
    batch: HTTP_HANDLER_BATCH,
    sanity: () => {
      const result = simulateRequest(1);
      return result.includes("user-") && result.includes("SELECT");
    },
    build: () => {
      let requestIndex = 0;
      return batched(HTTP_HANDLER_BATCH, () => {
        simulateRequest(requestIndex++);
      });
    },
  };
}

// ─── scenario 2: Repository + Unit of Work ────────────────────────────────────

const UOW_BATCH = 100;

interface DbPool {
  acquire(): string;
}

interface UnitOfWork {
  readonly transactionId: string;
  commit(): void;
}

interface UserRepository {
  findById(id: string): string;
}

interface UserService {
  getUser(id: string): string;
}

const dbPoolToken = token<DbPool>("bench-cf-prod-uow-db-pool");
const unitOfWorkToken = token<UnitOfWork>("bench-cf-prod-unit-of-work");
const userRepositoryToken = token<UserRepository>("bench-cf-prod-user-repository");
const userServiceToken = token<UserService>("bench-cf-prod-user-service");

function buildProductionUnitOfWorkScenario(): BenchScenario {
  const appContainer = Container.create();
  let connectionCounter = 0;

  appContainer
    .bind(dbPoolToken)
    .toDynamic(() => ({ acquire: () => `conn-${String(++connectionCounter)}` }))
    .singleton();

  function runOneOperation(operationIndex: number): string {
    const operationChild = appContainer.createChild();

    operationChild
      .bind(unitOfWorkToken)
      .toDynamic((ctx) => {
        const pool = ctx.resolve(dbPoolToken);
        const connectionId = pool.acquire();
        return {
          transactionId: `tx-${String(operationIndex)}-${connectionId}`,
          commit: () => undefined,
        };
      })
      .singleton();

    operationChild
      .bind(userRepositoryToken)
      .toDynamic((ctx) => {
        const uow = ctx.resolve(unitOfWorkToken);
        return { findById: (id: string) => `user:${id}@${uow.transactionId}` };
      })
      .transient();

    operationChild
      .bind(userServiceToken)
      .toDynamic((ctx) => {
        const repo = ctx.resolve(userRepositoryToken);
        return { getUser: (id: string) => repo.findById(id) };
      })
      .transient();

    const service = operationChild.resolve(userServiceToken);
    const result = service.getUser("42");
    const uow = operationChild.resolve(unitOfWorkToken);
    uow.commit();
    operationChild.unbindAll();
    return result;
  }

  // Pre-warm singleton DB pool.
  runOneOperation(0);

  return {
    id: "production-unit-of-work",
    group: "production",
    what: "per-operation child container: UoW + Repository + Service resolve, commit, then dispose",
    batch: UOW_BATCH,
    sanity: () => {
      const result = runOneOperation(1);
      return result.startsWith("user:42@tx-");
    },
    build: () => {
      let operationIndex = 0;
      return batched(UOW_BATCH, () => {
        runOneOperation(operationIndex++);
      });
    },
  };
}

// ─── scenario 3: Event bus dispatcher ─────────────────────────────────────────

const EVENT_HANDLER_COUNT = 8;
const EVENT_DISPATCH_BATCH = 100;

interface EventHandler {
  handle(event: string): void;
}

const eventHandlerToken = token<EventHandler>("bench-cf-prod-event-handler");

function buildProductionEventBusDispatchScenario(): BenchScenario {
  const container = Container.create();

  for (let handlerIndex = 0; handlerIndex < EVENT_HANDLER_COUNT; handlerIndex++) {
    const index = handlerIndex;
    const handler: EventHandler = { handle: (_event: string) => void index };
    container
      .bind(eventHandlerToken)
      .toConstantValue(handler)
      .when(() => true);
  }

  // Pre-warm so singleton handler list is cached.
  const prewarmedHandlers = container.resolveAll(eventHandlerToken);

  return {
    id: "production-event-bus-dispatch",
    group: "production",
    what: `resolveAll() ${String(EVENT_HANDLER_COUNT)} singleton event handlers then dispatch event to each`,
    batch: EVENT_DISPATCH_BATCH,
    sanity: () => prewarmedHandlers.length === EVENT_HANDLER_COUNT,
    build: () =>
      batched(EVENT_DISPATCH_BATCH, () => {
        const handlers = container.resolveAll(eventHandlerToken);
        for (const handler of handlers) {
          handler.handle("user.created");
        }
      }),
  };
}

export function buildCodefastProductionScenarios(): readonly BenchScenario[] {
  return [
    buildProductionHttpHandlerScenario(),
    buildProductionUnitOfWorkScenario(),
    buildProductionEventBusDispatchScenario(),
  ];
}
