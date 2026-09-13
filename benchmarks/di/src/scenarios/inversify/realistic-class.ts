/**
 * InversifyJS 8 — the realistic graph as constructor-injected classes: `@injectable()` with an
 * explicit `@inject(Class)` per parameter and every class bound `toSelf()`.
 */
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";

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

function buildClassContainer(): Container {
  const container = new Container({ jitless: false });
  container.bind(LoggerService).toSelf().inSingletonScope();
  container.bind(ConfigService).toSelf().inSingletonScope();
  container.bind(MetricsService).toSelf().inSingletonScope();
  container.bind(CacheService).toSelf().inSingletonScope();
  container.bind(HttpClient).toSelf().inSingletonScope();
  container.bind(UserRepository).toSelf().inSingletonScope();
  container.bind(OrderRepository).toSelf().inSingletonScope();
  container.bind(UserService).toSelf().inSingletonScope();
  container.bind(OrderService).toSelf().inSingletonScope();
  container.bind(ApiController).toSelf().inTransientScope();
  return container;
}

function sanityCheckClassGraph(): boolean {
  const container = buildClassContainer();
  return isRealisticClassGraphWellFormed(REALISTIC_GRAPH, container.get(ApiController), container.get(ApiController));
}

function buildClassResolveRootScenario(): BenchScenario {
  const container = buildClassContainer();
  container.get(ApiController);

  return {
    ...REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
    what: "resolve the transient root of the 10-node graph as @injectable + @inject classes bound toSelf()",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: sanityCheckClassGraph,
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.get(ApiController);
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
        buildClassContainer().get(ApiController);
      };
    },
  };
}

/**
 * Builds the class-lane realistic scenarios.
 */
export function buildInversifyRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
