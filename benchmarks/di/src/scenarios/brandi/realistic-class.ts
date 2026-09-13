/**
 * Brandi — the realistic graph as classes: plain constructors wired with `injected()` and bound
 * `toInstance()` under a token per node, brandi's decorator-free class idiom.
 */
import type { Container } from "brandi";
import { createContainer, injected, token } from "brandi";

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

class LoggerService implements RealisticNode {
  readonly __id = "LoggerService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode> = [];
}

class ConfigService implements RealisticNode {
  readonly __id = "ConfigService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode> = [];
}

class MetricsService implements RealisticNode {
  readonly __id = "MetricsService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(logger: LoggerService) {
    this.resolvedDependencies = [logger];
  }
}

class CacheService implements RealisticNode {
  readonly __id = "CacheService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(logger: LoggerService, config: ConfigService) {
    this.resolvedDependencies = [logger, config];
  }
}

class HttpClient implements RealisticNode {
  readonly __id = "HttpClient";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(logger: LoggerService, config: ConfigService) {
    this.resolvedDependencies = [logger, config];
  }
}

class UserRepository implements RealisticNode {
  readonly __id = "UserRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(http: HttpClient, cache: CacheService, logger: LoggerService) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

class OrderRepository implements RealisticNode {
  readonly __id = "OrderRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(http: HttpClient, cache: CacheService, logger: LoggerService) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

class UserService implements RealisticNode {
  readonly __id = "UserService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(users: UserRepository, metrics: MetricsService, logger: LoggerService) {
    this.resolvedDependencies = [users, metrics, logger];
  }
}

class OrderService implements RealisticNode {
  readonly __id = "OrderService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(orders: OrderRepository, users: UserService, metrics: MetricsService, logger: LoggerService) {
    this.resolvedDependencies = [orders, users, metrics, logger];
  }
}

class ApiController implements RealisticNode {
  readonly __id = "ApiController";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(orders: OrderService, users: UserService, logger: LoggerService) {
    this.resolvedDependencies = [orders, users, logger];
  }
}

const LOGGER = token<LoggerService>("bench-brandi-class-logger");
const CONFIG = token<ConfigService>("bench-brandi-class-config");
const METRICS = token<MetricsService>("bench-brandi-class-metrics");
const CACHE = token<CacheService>("bench-brandi-class-cache");
const HTTP = token<HttpClient>("bench-brandi-class-http");
const USER_REPOSITORY = token<UserRepository>("bench-brandi-class-user-repository");
const ORDER_REPOSITORY = token<OrderRepository>("bench-brandi-class-order-repository");
const USER_SERVICE = token<UserService>("bench-brandi-class-user-service");
const ORDER_SERVICE = token<OrderService>("bench-brandi-class-order-service");
const API_CONTROLLER = token<ApiController>("bench-brandi-class-api-controller");

injected(MetricsService, LOGGER);
injected(CacheService, LOGGER, CONFIG);
injected(HttpClient, LOGGER, CONFIG);
injected(UserRepository, HTTP, CACHE, LOGGER);
injected(OrderRepository, HTTP, CACHE, LOGGER);
injected(UserService, USER_REPOSITORY, METRICS, LOGGER);
injected(OrderService, ORDER_REPOSITORY, USER_SERVICE, METRICS, LOGGER);
injected(ApiController, ORDER_SERVICE, USER_SERVICE, LOGGER);

function buildClassContainer(): Container {
  const container = createContainer();
  container.bind(LOGGER).toInstance(LoggerService).inSingletonScope();
  container.bind(CONFIG).toInstance(ConfigService).inSingletonScope();
  container.bind(METRICS).toInstance(MetricsService).inSingletonScope();
  container.bind(CACHE).toInstance(CacheService).inSingletonScope();
  container.bind(HTTP).toInstance(HttpClient).inSingletonScope();
  container.bind(USER_REPOSITORY).toInstance(UserRepository).inSingletonScope();
  container.bind(ORDER_REPOSITORY).toInstance(OrderRepository).inSingletonScope();
  container.bind(USER_SERVICE).toInstance(UserService).inSingletonScope();
  container.bind(ORDER_SERVICE).toInstance(OrderService).inSingletonScope();
  container.bind(API_CONTROLLER).toInstance(ApiController).inTransientScope();
  return container;
}

function sanityCheckClassGraph(): boolean {
  const container = buildClassContainer();
  return isRealisticClassGraphWellFormed(REALISTIC_GRAPH, container.get(API_CONTROLLER), container.get(API_CONTROLLER));
}

function buildClassResolveRootScenario(): BenchScenario {
  const container = buildClassContainer();
  container.get(API_CONTROLLER);

  return {
    ...REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
    what: "get() the transient root of the 10-node graph as injected() classes bound toInstance()",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: sanityCheckClassGraph,
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.get(API_CONTROLLER);
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
        buildClassContainer().get(API_CONTROLLER);
      };
    },
  };
}

/**
 * Builds the class-lane realistic scenarios.
 *
 * @since 0.8.0
 */
export function buildBrandiRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
