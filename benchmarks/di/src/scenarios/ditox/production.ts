/**
 * Ditox — production-shaped scenarios. Parallel to `../codefast/production.ts`.
 *
 * Ditox mapping:
 *   - `Container.create()` → `createContainer()`
 *   - `container.createChild()` → `createContainer(parent)`
 *   - `.toDynamic(fn).singleton()` → `bindFactory(token, injectable(fn, ...deps), { scope: "singleton" })`
 *   - `.toDynamic(fn).transient()` → the same with `{ scope: "transient" }`
 *   - a child-owned singleton → a `singleton` factory bound in the child, dropped with it
 *   - `container.resolveAll(token)` → `bindMultiValue` + `resolve()`, which hands back the cached array
 *   - `child.unbindAll()` → `child.removeAll()`
 */
import { bindMultiValue, createContainer, injectable, token } from "ditox";

import {
  EVENT_DISPATCH_BATCH,
  EVENT_HANDLER_COUNT,
  HTTP_HANDLER_BATCH,
  PRODUCTION_EVENT_BUS_DISPATCH,
  PRODUCTION_HTTP_HANDLER,
  PRODUCTION_UNIT_OF_WORK,
  UOW_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

// ── scenario 1: HTTP request pipeline ────────────────────────────────────────────────────────────────────────────────

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

const httpConfigToken = token<HttpConfig>("bench-ditox-prod-http-config");
const httpDbPoolToken = token<HttpDbPool>("bench-ditox-prod-http-db-pool");
const httpLoggerToken = token<HttpLogger>("bench-ditox-prod-http-logger");
const httpTraceIdToken = token<string>("bench-ditox-prod-http-trace-id");
const httpAuthContextToken = token<HttpAuthContext>("bench-ditox-prod-http-auth-context");
const httpHandlerToken = token<HttpHandler>("bench-ditox-prod-http-handler");

const authContextFactory = injectable(
  (traceId: string): HttpAuthContext => ({ userId: `user-${traceId}`, role: "admin" }),
  httpTraceIdToken,
);
const handlerFactory = injectable(
  (db: HttpDbPool, logger: HttpLogger, auth: HttpAuthContext): HttpHandler => ({
    process: () => {
      logger.info(`[${auth.userId}] handling`);
      return db.query(`SELECT * FROM users WHERE id='${auth.userId}'`);
    },
  }),
  httpDbPoolToken,
  httpLoggerToken,
  httpAuthContextToken,
);

function buildProductionHttpHandlerScenario(): BenchScenario {
  const appContainer = createContainer();
  appContainer.bindFactory(httpConfigToken, () => ({ env: "production", dbUrl: "postgres://localhost/app" }), {
    scope: "singleton",
  });
  appContainer.bindFactory(
    httpDbPoolToken,
    injectable(
      (config: HttpConfig): HttpDbPool => ({ query: (sql: string) => `${config.dbUrl}:${sql}` }),
      httpConfigToken,
    ),
    { scope: "singleton" },
  );
  appContainer.bindFactory(httpLoggerToken, (): HttpLogger => ({ info: (_message: string) => undefined }), {
    scope: "singleton",
  });

  function simulateRequest(requestIndex: number): string {
    const requestChild = createContainer(appContainer);
    requestChild.bindValue(httpTraceIdToken, `trace-${String(requestIndex)}`);
    requestChild.bindFactory(httpAuthContextToken, authContextFactory, { scope: "transient" });
    requestChild.bindFactory(httpHandlerToken, handlerFactory, { scope: "transient" });

    const result = requestChild.resolve(httpHandlerToken).process();
    requestChild.removeAll();
    return result;
  }

  // Pre-warm app-level singletons.
  simulateRequest(0);

  return {
    ...PRODUCTION_HTTP_HANDLER,
    what: "per-request createContainer(app): trace ID bindValue + auth context + handler bindFactory, resolve, then removeAll()",
    batch: HTTP_HANDLER_BATCH,
    sanity: () => {
      const result = simulateRequest(1);
      return result.includes("user-trace-1") && result.includes("SELECT");
    },
    build: () => {
      let requestIndex = 0;
      return batched(HTTP_HANDLER_BATCH, () => {
        simulateRequest(requestIndex++);
      });
    },
  };
}

// ── scenario 2: Repository + Unit of Work ────────────────────────────────────────────────────────────────────────────

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

const dbPoolToken = token<DbPool>("bench-ditox-prod-uow-db-pool");
const unitOfWorkToken = token<UnitOfWork>("bench-ditox-prod-unit-of-work");
const userRepositoryToken = token<UserRepository>("bench-ditox-prod-user-repository");
const userServiceToken = token<UserService>("bench-ditox-prod-user-service");

const userRepositoryFactory = injectable(
  (unitOfWork: UnitOfWork): UserRepository => ({ findById: (id: string) => `user:${id}@${unitOfWork.transactionId}` }),
  unitOfWorkToken,
);
const userServiceFactory = injectable(
  (repository: UserRepository): UserService => ({ getUser: (id: string) => repository.findById(id) }),
  userRepositoryToken,
);

function buildProductionUnitOfWorkScenario(): BenchScenario {
  const appContainer = createContainer();
  let connectionCounter = 0;
  appContainer.bindFactory(dbPoolToken, (): DbPool => ({ acquire: () => `conn-${String(++connectionCounter)}` }), {
    scope: "singleton",
  });

  function runOneOperation(operationIndex: number): string {
    const operationChild = createContainer(appContainer);
    operationChild.bindFactory(
      unitOfWorkToken,
      injectable(
        (pool: DbPool): UnitOfWork => ({
          transactionId: `tx-${String(operationIndex)}-${pool.acquire()}`,
          commit: () => undefined,
        }),
        dbPoolToken,
      ),
      // A singleton bound in the child lives exactly as long as the operation.
      { scope: "singleton" },
    );
    operationChild.bindFactory(userRepositoryToken, userRepositoryFactory, { scope: "transient" });
    operationChild.bindFactory(userServiceToken, userServiceFactory, { scope: "transient" });

    const result = operationChild.resolve(userServiceToken).getUser("42");
    const unitOfWork = operationChild.resolve(unitOfWorkToken);
    unitOfWork.commit();
    operationChild.removeAll();
    if (!result.endsWith(unitOfWork.transactionId)) {
      throw new Error("Expected the repository and the commit to share one unit of work per operation");
    }
    return result;
  }

  // Pre-warm singleton DB pool.
  runOneOperation(0);

  return {
    ...PRODUCTION_UNIT_OF_WORK,
    what: "per-operation createContainer(app): child-bound singleton UoW + transient repository and service, commit, then removeAll()",
    batch: UOW_BATCH,
    sanity: () => runOneOperation(1).startsWith("user:42@tx-1-"),
    build: () => {
      let operationIndex = 0;
      return batched(UOW_BATCH, () => {
        runOneOperation(operationIndex++);
      });
    },
  };
}

// ── scenario 3: Event bus dispatcher ─────────────────────────────────────────────────────────────────────────────────

interface EventHandler {
  handle(event: string): void;
}

const eventHandlerToken = token<ReadonlyArray<EventHandler>>("bench-ditox-prod-event-handler");

function buildProductionEventBusDispatchScenario(): BenchScenario {
  const container = createContainer();
  for (let handlerIndex = 0; handlerIndex < EVENT_HANDLER_COUNT; handlerIndex++) {
    const index = handlerIndex;
    bindMultiValue(container, eventHandlerToken, { handle: (_event: string) => void index });
  }
  const prewarmedHandlers = container.resolve(eventHandlerToken);

  return {
    ...PRODUCTION_EVENT_BUS_DISPATCH,
    // ditox hands back the cached bindMultiValue array, so this row is dispatch over a cached collection.
    what: `resolve() the cached bindMultiValue collection of ${String(EVENT_HANDLER_COUNT)} handlers then dispatch event to each`,
    batch: EVENT_DISPATCH_BATCH,
    sanity: () => prewarmedHandlers.length === EVENT_HANDLER_COUNT,
    build: () =>
      batched(EVENT_DISPATCH_BATCH, () => {
        for (const handler of container.resolve(eventHandlerToken)) {
          handler.handle("user.created");
        }
      }),
  };
}

/**
 * Builds ditox's production-shaped scenarios.
 */
export function buildDitoxProductionScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildProductionHttpHandlerScenario(),
    buildProductionUnitOfWorkScenario(),
    buildProductionEventBusDispatchScenario(),
  ];
}
