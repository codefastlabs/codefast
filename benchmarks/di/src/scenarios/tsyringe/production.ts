/**
 * tsyringe — production-shaped scenarios. Parallel to `../codefast/production.ts`.
 *
 * tsyringe mapping:
 *   - `Container.create()` → `container.createChildContainer()` off the global root
 *   - `container.createChild()` → `createChildContainer()`
 *   - `.toDynamic(fn).singleton()` → `{ useFactory: instanceCachingFactory(fn) }`
 *   - a child-owned singleton → `{ useFactory: instancePerContainerCachingFactory(fn) }`
 *   - `.toDynamic(fn).transient()` → `{ useFactory: fn }` (a factory provider never caches)
 *   - `container.resolveAll(token)` → `resolveAll()`, which rebuilds the array each call
 *   - `child.unbindAll()` → `child.dispose()`
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import {
  container as tsyringeRootContainer,
  instanceCachingFactory,
  instancePerContainerCachingFactory,
} from "tsyringe";

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

const httpConfigToken = Symbol("bench-tsyringe-prod-http-config");
const httpDbPoolToken = Symbol("bench-tsyringe-prod-http-db-pool");
const httpLoggerToken = Symbol("bench-tsyringe-prod-http-logger");
const httpTraceIdToken = Symbol("bench-tsyringe-prod-http-trace-id");
const httpAuthContextToken = Symbol("bench-tsyringe-prod-http-auth-context");
const httpHandlerToken = Symbol("bench-tsyringe-prod-http-handler");

function buildProductionHttpHandlerScenario(): BenchScenario {
  const appContainer = tsyringeRootContainer.createChildContainer();
  appContainer.register<HttpConfig>(httpConfigToken, {
    useFactory: instanceCachingFactory(() => ({ env: "production", dbUrl: "postgres://localhost/app" })),
  });
  appContainer.register<HttpDbPool>(httpDbPoolToken, {
    useFactory: instanceCachingFactory((dependencyContainer: DependencyContainer) => {
      const config = dependencyContainer.resolve<HttpConfig>(httpConfigToken);
      return { query: (sql: string) => `${config.dbUrl}:${sql}` };
    }),
  });
  appContainer.register<HttpLogger>(httpLoggerToken, {
    useFactory: instanceCachingFactory(() => ({ info: (_message: string) => undefined })),
  });

  function simulateRequest(requestIndex: number): string {
    const requestChild = appContainer.createChildContainer();
    requestChild.register<string>(httpTraceIdToken, { useValue: `trace-${String(requestIndex)}` });
    requestChild.register<HttpAuthContext>(httpAuthContextToken, {
      useFactory: (dependencyContainer) => ({
        userId: `user-${dependencyContainer.resolve<string>(httpTraceIdToken)}`,
        role: "admin",
      }),
    });
    requestChild.register<HttpHandler>(httpHandlerToken, {
      useFactory: (dependencyContainer) => {
        const db = dependencyContainer.resolve<HttpDbPool>(httpDbPoolToken);
        const logger = dependencyContainer.resolve<HttpLogger>(httpLoggerToken);
        const auth = dependencyContainer.resolve<HttpAuthContext>(httpAuthContextToken);
        return {
          process: () => {
            logger.info(`[${auth.userId}] handling`);
            return db.query(`SELECT * FROM users WHERE id='${auth.userId}'`);
          },
        };
      },
    });

    const result = requestChild.resolve<HttpHandler>(httpHandlerToken).process();
    void requestChild.dispose();
    return result;
  }

  // Pre-warm app-level singletons.
  simulateRequest(0);

  return {
    ...PRODUCTION_HTTP_HANDLER,
    what: "per-request createChildContainer(): trace ID + auth context + handler factory providers, resolve, then dispose()",
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

const dbPoolToken = Symbol("bench-tsyringe-prod-uow-db-pool");
const unitOfWorkToken = Symbol("bench-tsyringe-prod-unit-of-work");
const userRepositoryToken = Symbol("bench-tsyringe-prod-user-repository");
const userServiceToken = Symbol("bench-tsyringe-prod-user-service");

function buildProductionUnitOfWorkScenario(): BenchScenario {
  const appContainer = tsyringeRootContainer.createChildContainer();
  let connectionCounter = 0;
  appContainer.register<DbPool>(dbPoolToken, {
    useFactory: instanceCachingFactory(() => ({ acquire: () => `conn-${String(++connectionCounter)}` })),
  });

  function runOneOperation(operationIndex: number): string {
    const operationChild = appContainer.createChildContainer();
    operationChild.register<UnitOfWork>(unitOfWorkToken, {
      // Cached per container: one unit of work per operation child, fresh for the next.
      useFactory: instancePerContainerCachingFactory((dependencyContainer: DependencyContainer) => ({
        transactionId: `tx-${String(operationIndex)}-${dependencyContainer.resolve<DbPool>(dbPoolToken).acquire()}`,
        commit: () => undefined,
      })),
    });
    operationChild.register<UserRepository>(userRepositoryToken, {
      useFactory: (dependencyContainer) => {
        const unitOfWork = dependencyContainer.resolve<UnitOfWork>(unitOfWorkToken);
        return { findById: (id: string) => `user:${id}@${unitOfWork.transactionId}` };
      },
    });
    operationChild.register<UserService>(userServiceToken, {
      useFactory: (dependencyContainer) => {
        const repository = dependencyContainer.resolve<UserRepository>(userRepositoryToken);
        return { getUser: (id: string) => repository.findById(id) };
      },
    });

    const result = operationChild.resolve<UserService>(userServiceToken).getUser("42");
    const unitOfWork = operationChild.resolve<UnitOfWork>(unitOfWorkToken);
    unitOfWork.commit();
    void operationChild.dispose();
    if (!result.endsWith(unitOfWork.transactionId)) {
      throw new Error("Expected the repository and the commit to share one unit of work per operation");
    }
    return result;
  }

  // Pre-warm singleton DB pool.
  runOneOperation(0);

  return {
    ...PRODUCTION_UNIT_OF_WORK,
    what: "per-operation createChildContainer(): instancePerContainerCachingFactory UoW + factory repository and service, commit, then dispose()",
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

const eventHandlerToken = Symbol("bench-tsyringe-prod-event-handler");

function buildProductionEventBusDispatchScenario(): BenchScenario {
  const container = tsyringeRootContainer.createChildContainer();
  for (let handlerIndex = 0; handlerIndex < EVENT_HANDLER_COUNT; handlerIndex++) {
    const index = handlerIndex;
    container.register<EventHandler>(eventHandlerToken, { useValue: { handle: (_event: string) => void index } });
  }
  const prewarmedHandlers = container.resolveAll<EventHandler>(eventHandlerToken);

  return {
    ...PRODUCTION_EVENT_BUS_DISPATCH,
    what: `resolveAll() ${String(EVENT_HANDLER_COUNT)} registered event handlers then dispatch event to each`,
    batch: EVENT_DISPATCH_BATCH,
    sanity: () => prewarmedHandlers.length === EVENT_HANDLER_COUNT,
    build: () =>
      batched(EVENT_DISPATCH_BATCH, () => {
        for (const handler of container.resolveAll<EventHandler>(eventHandlerToken)) {
          handler.handle("user.created");
        }
      }),
  };
}

/**
 * Builds tsyringe's production-shaped scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeProductionScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildProductionHttpHandlerScenario(),
    buildProductionUnitOfWorkScenario(),
    buildProductionEventBusDispatchScenario(),
  ];
}
