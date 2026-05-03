/**
 * InversifyJS 8 — production-shaped scenarios. Parallel to
 * {@link ../codefast/production.ts}.
 *
 * Inversify-specific mapping:
 *   - `Container.create()` → `new Container()`
 *   - `container.createChild()` → `new Container({ parent: ... })`
 *   - `container.resolve(token)` → `container.get(identifier)`
 *   - `container.resolveAll(token)` → `container.getAll(identifier)`
 *   - `.toDynamic(fn).transient()` → `.toDynamicValue(fn).inTransientScope()`
 *   - `.toDynamic(fn).singleton()` → `.toDynamicValue(fn).inSingletonScope()`
 *   - `.toConstantValue(v).when(pred)` → `.toConstantValue(v).when(pred)`
 *   - Resolution context: `ctx.resolve(t)` → `ctx.get(id)`
 */
import "reflect-metadata";
import { Container } from "inversify";
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

const httpConfigId = Symbol("bench-inv-prod-http-config");
const httpDbPoolId = Symbol("bench-inv-prod-http-db-pool");
const httpLoggerId = Symbol("bench-inv-prod-http-logger");
const httpTraceIdId = Symbol("bench-inv-prod-http-trace-id");
const httpAuthContextId = Symbol("bench-inv-prod-http-auth-context");
const httpHandlerId = Symbol("bench-inv-prod-http-handler");

function buildProductionHttpHandlerScenario(): BenchScenario {
  const appContainer = new Container();

  appContainer
    .bind<HttpConfig>(httpConfigId)
    .toDynamicValue(() => ({ env: "production", dbUrl: "postgres://localhost/app" }))
    .inSingletonScope();

  appContainer
    .bind<HttpDbPool>(httpDbPoolId)
    .toDynamicValue((ctx) => {
      const config = ctx.get<HttpConfig>(httpConfigId);
      return { query: (sql: string) => `${config.dbUrl}:${sql}` };
    })
    .inSingletonScope();

  appContainer
    .bind<HttpLogger>(httpLoggerId)
    .toDynamicValue(() => ({ info: (_message: string) => undefined }))
    .inSingletonScope();

  function simulateRequest(requestIndex: number): string {
    const requestChild = new Container({ parent: appContainer });

    requestChild.bind<string>(httpTraceIdId).toConstantValue(`trace-${String(requestIndex)}`);

    requestChild
      .bind<HttpAuthContext>(httpAuthContextId)
      .toDynamicValue((ctx) => {
        const traceId = ctx.get<string>(httpTraceIdId);
        return { userId: `user-${traceId}`, role: "admin" };
      })
      .inTransientScope();

    requestChild
      .bind<HttpHandler>(httpHandlerId)
      .toDynamicValue((ctx) => {
        const db = ctx.get<HttpDbPool>(httpDbPoolId);
        const logger = ctx.get<HttpLogger>(httpLoggerId);
        const auth = ctx.get<HttpAuthContext>(httpAuthContextId);
        return {
          process: () => {
            logger.info(`[${auth.userId}] handling`);
            return db.query(`SELECT * FROM users WHERE id='${auth.userId}'`);
          },
        };
      })
      .inTransientScope();

    const handler = requestChild.get<HttpHandler>(httpHandlerId);
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

const dbPoolId = Symbol("bench-inv-prod-uow-db-pool");
const unitOfWorkId = Symbol("bench-inv-prod-unit-of-work");
const userRepositoryId = Symbol("bench-inv-prod-user-repository");
const userServiceId = Symbol("bench-inv-prod-user-service");

function buildProductionUnitOfWorkScenario(): BenchScenario {
  const appContainer = new Container();
  let connectionCounter = 0;

  appContainer
    .bind<DbPool>(dbPoolId)
    .toDynamicValue(() => ({ acquire: () => `conn-${String(++connectionCounter)}` }))
    .inSingletonScope();

  function runOneOperation(operationIndex: number): string {
    const operationChild = new Container({ parent: appContainer });

    operationChild
      .bind<UnitOfWork>(unitOfWorkId)
      .toDynamicValue((ctx) => {
        const pool = ctx.get<DbPool>(dbPoolId);
        const connectionId = pool.acquire();
        return {
          transactionId: `tx-${String(operationIndex)}-${connectionId}`,
          commit: () => undefined,
        };
      })
      .inSingletonScope();

    operationChild
      .bind<UserRepository>(userRepositoryId)
      .toDynamicValue((ctx) => {
        const uow = ctx.get<UnitOfWork>(unitOfWorkId);
        return { findById: (id: string) => `user:${id}@${uow.transactionId}` };
      })
      .inTransientScope();

    operationChild
      .bind<UserService>(userServiceId)
      .toDynamicValue((ctx) => {
        const repo = ctx.get<UserRepository>(userRepositoryId);
        return { getUser: (id: string) => repo.findById(id) };
      })
      .inTransientScope();

    const service = operationChild.get<UserService>(userServiceId);
    const result = service.getUser("42");
    const uow = operationChild.get<UnitOfWork>(unitOfWorkId);
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

const eventHandlerId = Symbol("bench-inv-prod-event-handler");

function buildProductionEventBusDispatchScenario(): BenchScenario {
  const container = new Container();

  for (let handlerIndex = 0; handlerIndex < EVENT_HANDLER_COUNT; handlerIndex++) {
    const index = handlerIndex;
    const handler: EventHandler = { handle: (_event: string) => void index };
    container
      .bind<EventHandler>(eventHandlerId)
      .toConstantValue(handler)
      .when(() => true);
  }

  // Pre-warm so the handler list is returned from cache on first measured sample.
  const prewarmedHandlers = container.getAll<EventHandler>(eventHandlerId);

  return {
    id: "production-event-bus-dispatch",
    group: "production",
    what: `getAll() ${String(EVENT_HANDLER_COUNT)} singleton event handlers then dispatch event to each`,
    batch: EVENT_DISPATCH_BATCH,
    sanity: () => prewarmedHandlers.length === EVENT_HANDLER_COUNT,
    build: () =>
      batched(EVENT_DISPATCH_BATCH, () => {
        const handlers = container.getAll<EventHandler>(eventHandlerId);
        for (const handler of handlers) {
          handler.handle("user.created");
        }
      }),
  };
}

export function buildInversifyProductionScenarios(): readonly BenchScenario[] {
  return [
    buildProductionHttpHandlerScenario(),
    buildProductionUnitOfWorkScenario(),
    buildProductionEventBusDispatchScenario(),
  ];
}
