/**
 * tsyringe — the realistic graph as constructor-injected classes: `@injectable()` with an explicit
 * `@inject(Class)` per parameter, every class registered `useClass` against itself.
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import { container as tsyringeRootContainer, inject, injectable, Lifecycle } from "tsyringe";

import { isRealisticClassGraphWellFormed } from "#/fixtures/realistic-class-graph";
import type { RealisticNode } from "#/fixtures/realistic-graph";
import { REALISTIC_GRAPH } from "#/fixtures/realistic-graph";
import {
  REALISTIC_GRAPH_CLASS_COLD_RESOLVE,
  REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
  REALISTIC_RESOLVE_BATCH,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

@injectable()
class LoggerService implements RealisticNode {
  readonly __id = "LoggerService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode> = [];
}

@injectable()
class ConfigService implements RealisticNode {
  readonly __id = "ConfigService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode> = [];
}

@injectable()
class MetricsService implements RealisticNode {
  readonly __id = "MetricsService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [logger];
  }
}

@injectable()
class CacheService implements RealisticNode {
  readonly __id = "CacheService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(ConfigService)
    config: ConfigService,
  ) {
    this.resolvedDependencies = [logger, config];
  }
}

@injectable()
class HttpClient implements RealisticNode {
  readonly __id = "HttpClient";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(ConfigService)
    config: ConfigService,
  ) {
    this.resolvedDependencies = [logger, config];
  }
}

@injectable()
class UserRepository implements RealisticNode {
  readonly __id = "UserRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(HttpClient)
    http: HttpClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(CacheService)
    cache: CacheService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

@injectable()
class OrderRepository implements RealisticNode {
  readonly __id = "OrderRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(HttpClient)
    http: HttpClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(CacheService)
    cache: CacheService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

@injectable()
class UserService implements RealisticNode {
  readonly __id = "UserService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(UserRepository)
    users: UserRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(MetricsService)
    metrics: MetricsService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [users, metrics, logger];
  }
}

@injectable()
class OrderService implements RealisticNode {
  readonly __id = "OrderService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(OrderRepository)
    orders: OrderRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(UserService)
    users: UserService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(MetricsService)
    metrics: MetricsService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [orders, users, metrics, logger];
  }
}

@injectable()
class ApiController implements RealisticNode {
  readonly __id = "ApiController";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(OrderService)
    orders: OrderService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(UserService)
    users: UserService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [orders, users, logger];
  }
}

const SINGLETON = { lifecycle: Lifecycle.Singleton };

function buildClassContainer(): DependencyContainer {
  const container = tsyringeRootContainer.createChildContainer();
  container.register(LoggerService, { useClass: LoggerService }, SINGLETON);
  container.register(ConfigService, { useClass: ConfigService }, SINGLETON);
  container.register(MetricsService, { useClass: MetricsService }, SINGLETON);
  container.register(CacheService, { useClass: CacheService }, SINGLETON);
  container.register(HttpClient, { useClass: HttpClient }, SINGLETON);
  container.register(UserRepository, { useClass: UserRepository }, SINGLETON);
  container.register(OrderRepository, { useClass: OrderRepository }, SINGLETON);
  container.register(UserService, { useClass: UserService }, SINGLETON);
  container.register(OrderService, { useClass: OrderService }, SINGLETON);
  container.register(ApiController, { useClass: ApiController });
  return container;
}

function sanityCheckClassGraph(): boolean {
  const container = buildClassContainer();
  return isRealisticClassGraphWellFormed(
    REALISTIC_GRAPH,
    container.resolve(ApiController),
    container.resolve(ApiController),
  );
}

function buildClassResolveRootScenario(): BenchScenario {
  const container = buildClassContainer();
  container.resolve(ApiController);

  return {
    ...REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
    what: "resolve the transient root of the 10-node graph as @injectable + @inject classes registered useClass",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: sanityCheckClassGraph,
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve(ApiController);
      }),
  };
}

function buildClassColdResolveScenario(): BenchScenario {
  return {
    ...REALISTIC_GRAPH_CLASS_COLD_RESOLVE,
    batch: 1,
    sanity: sanityCheckClassGraph,
    build: () => {
      return () => {
        buildClassContainer().resolve(ApiController);
      };
    },
  };
}

/**
 * Builds the class-lane realistic scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
