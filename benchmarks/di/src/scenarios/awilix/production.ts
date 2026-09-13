/**
 * Awilix — production-shaped scenarios. Parallel to `../codefast/production.ts`.
 *
 * Awilix mapping:
 *   - `Container.create()` → `createContainer()` (proxy cradle)
 *   - `container.createChild()` → `container.createScope()`
 *   - `.toDynamic(fn).singleton()` → `asFunction(fn).singleton()`
 *   - `.toDynamic(fn).transient()` → `asFunction(fn).transient()`
 *   - a child-owned singleton → `asFunction(fn).scoped()` registered in the scope
 *   - `child.unbindAll()` → `scope.dispose()`, which runs disposers and clears the scope cache
 * The event-bus row is absent: awilix has no multi-binding collection.
 */
import type { AwilixContainer } from "awilix";
import { asFunction, asValue, createContainer } from "awilix";

import {
  HTTP_HANDLER_BATCH,
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

interface HttpAppCradle {
  readonly config: HttpConfig;
  readonly dbPool: HttpDbPool;
  readonly logger: HttpLogger;
}

interface HttpRequestCradle extends HttpAppCradle {
  readonly traceId: string;
  readonly authContext: HttpAuthContext;
  readonly handler: HttpHandler;
}

function buildProductionHttpHandlerScenario(): BenchScenario {
  const appContainer: AwilixContainer<HttpAppCradle> = createContainer<HttpAppCradle>();
  appContainer.register({
    config: asFunction((): HttpConfig => ({ env: "production", dbUrl: "postgres://localhost/app" })).singleton(),
    dbPool: asFunction(({ config }: HttpAppCradle): HttpDbPool => ({
      query: (sql: string) => `${config.dbUrl}:${sql}`,
    })).singleton(),
    logger: asFunction((): HttpLogger => ({ info: (_message: string) => undefined })).singleton(),
  });

  function simulateRequest(requestIndex: number): string {
    const requestScope = appContainer.createScope<HttpRequestCradle>();
    requestScope.register({
      traceId: asValue(`trace-${String(requestIndex)}`),
      authContext: asFunction(({ traceId }: HttpRequestCradle): HttpAuthContext => ({
        userId: `user-${traceId}`,
        role: "admin",
      })).transient(),
      handler: asFunction(({ dbPool, logger, authContext }: HttpRequestCradle): HttpHandler => ({
        process: () => {
          logger.info(`[${authContext.userId}] handling`);
          return dbPool.query(`SELECT * FROM users WHERE id='${authContext.userId}'`);
        },
      })).transient(),
    });

    const result = requestScope.resolve<HttpHandler>("handler").process();
    void requestScope.dispose();
    return result;
  }

  // Pre-warm app-level singletons.
  simulateRequest(0);

  return {
    ...PRODUCTION_HTTP_HANDLER,
    what: "per-request createScope(): trace ID + auth context + handler asFunction registrations, resolve, then dispose()",
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

interface UowAppCradle {
  readonly dbPool: DbPool;
}

interface UowOperationCradle extends UowAppCradle {
  readonly unitOfWork: UnitOfWork;
  readonly userRepository: UserRepository;
  readonly userService: UserService;
}

function buildProductionUnitOfWorkScenario(): BenchScenario {
  const appContainer = createContainer<UowAppCradle>();
  let connectionCounter = 0;
  appContainer.register({
    dbPool: asFunction((): DbPool => ({ acquire: () => `conn-${String(++connectionCounter)}` })).singleton(),
  });

  function runOneOperation(operationIndex: number): string {
    const operationScope = appContainer.createScope<UowOperationCradle>();
    operationScope.register({
      // scoped(): one instance per operation scope — the child-owned singleton the other sides bind.
      unitOfWork: asFunction(({ dbPool }: UowOperationCradle): UnitOfWork => ({
        transactionId: `tx-${String(operationIndex)}-${dbPool.acquire()}`,
        commit: () => undefined,
      })).scoped(),
      userRepository: asFunction(({ unitOfWork }: UowOperationCradle): UserRepository => ({
        findById: (id: string) => `user:${id}@${unitOfWork.transactionId}`,
      })).transient(),
      userService: asFunction(({ userRepository }: UowOperationCradle): UserService => ({
        getUser: (id: string) => userRepository.findById(id),
      })).transient(),
    });

    const result = operationScope.resolve<UserService>("userService").getUser("42");
    const unitOfWork = operationScope.resolve<UnitOfWork>("unitOfWork");
    unitOfWork.commit();
    void operationScope.dispose();
    if (!result.endsWith(unitOfWork.transactionId)) {
      throw new Error("Expected the repository and the commit to share one unit of work per operation");
    }
    return result;
  }

  // Pre-warm singleton DB pool.
  runOneOperation(0);

  return {
    ...PRODUCTION_UNIT_OF_WORK,
    what: "per-operation createScope(): scoped() UoW + transient repository + service, resolve, commit, then dispose()",
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

/**
 * Builds Awilix's production-shaped scenarios.
 */
export function buildAwilixProductionScenarios(): ReadonlyArray<BenchScenario> {
  return [buildProductionHttpHandlerScenario(), buildProductionUnitOfWorkScenario()];
}
