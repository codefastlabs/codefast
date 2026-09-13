/**
 * `@codefast/di` — the realistic graph as constructor-injected classes: `@injectable([deps])` with
 * the class as its own token, the way an application wires services rather than factories.
 */
import { Container, injectable } from "@codefast/di";

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

@injectable([LoggerService])
class MetricsService implements RealisticNode {
  readonly __id = "MetricsService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(logger: LoggerService) {
    this.resolvedDependencies = [logger];
  }
}

@injectable([LoggerService, ConfigService])
class CacheService implements RealisticNode {
  readonly __id = "CacheService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(logger: LoggerService, config: ConfigService) {
    this.resolvedDependencies = [logger, config];
  }
}

@injectable([LoggerService, ConfigService])
class HttpClient implements RealisticNode {
  readonly __id = "HttpClient";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(logger: LoggerService, config: ConfigService) {
    this.resolvedDependencies = [logger, config];
  }
}

@injectable([HttpClient, CacheService, LoggerService])
class UserRepository implements RealisticNode {
  readonly __id = "UserRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(http: HttpClient, cache: CacheService, logger: LoggerService) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

@injectable([HttpClient, CacheService, LoggerService])
class OrderRepository implements RealisticNode {
  readonly __id = "OrderRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(http: HttpClient, cache: CacheService, logger: LoggerService) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

@injectable([UserRepository, MetricsService, LoggerService])
class UserService implements RealisticNode {
  readonly __id = "UserService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(users: UserRepository, metrics: MetricsService, logger: LoggerService) {
    this.resolvedDependencies = [users, metrics, logger];
  }
}

@injectable([OrderRepository, UserService, MetricsService, LoggerService])
class OrderService implements RealisticNode {
  readonly __id = "OrderService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(orders: OrderRepository, users: UserService, metrics: MetricsService, logger: LoggerService) {
    this.resolvedDependencies = [orders, users, metrics, logger];
  }
}

@injectable([OrderService, UserService, LoggerService])
class ApiController implements RealisticNode {
  readonly __id = "ApiController";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(orders: OrderService, users: UserService, logger: LoggerService) {
    this.resolvedDependencies = [orders, users, logger];
  }
}

function buildClassContainer(): Container {
  const container = Container.create();
  container.bind(LoggerService).to(LoggerService).singleton();
  container.bind(ConfigService).to(ConfigService).singleton();
  container.bind(MetricsService).to(MetricsService).singleton();
  container.bind(CacheService).to(CacheService).singleton();
  container.bind(HttpClient).to(HttpClient).singleton();
  container.bind(UserRepository).to(UserRepository).singleton();
  container.bind(OrderRepository).to(OrderRepository).singleton();
  container.bind(UserService).to(UserService).singleton();
  container.bind(OrderService).to(OrderService).singleton();
  container.bind(ApiController).to(ApiController).transient();
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
    what: "resolve the transient root of the 10-node graph as @injectable([deps]) classes bound to themselves",
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
 */
export function buildCodefastRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
