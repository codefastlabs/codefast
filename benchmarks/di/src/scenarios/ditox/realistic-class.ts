/**
 * Ditox — the realistic graph as classes: plain constructors wrapped by `injectableClass()` and bound
 * with `bindFactory` under a token per node, ditox's decorator-free class idiom.
 */
import type { Container } from "ditox";
import { createContainer, injectableClass, token } from "ditox";

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

const LOGGER = token<LoggerService>("bench-ditox-class-logger");
const CONFIG = token<ConfigService>("bench-ditox-class-config");
const METRICS = token<MetricsService>("bench-ditox-class-metrics");
const CACHE = token<CacheService>("bench-ditox-class-cache");
const HTTP = token<HttpClient>("bench-ditox-class-http");
const USER_REPOSITORY = token<UserRepository>("bench-ditox-class-user-repository");
const ORDER_REPOSITORY = token<OrderRepository>("bench-ditox-class-order-repository");
const USER_SERVICE = token<UserService>("bench-ditox-class-user-service");
const ORDER_SERVICE = token<OrderService>("bench-ditox-class-order-service");
const API_CONTROLLER = token<ApiController>("bench-ditox-class-api-controller");

const SINGLETON = { scope: "singleton" } as const;
const TRANSIENT = { scope: "transient" } as const;

function buildClassContainer(): Container {
  const container = createContainer();
  container.bindFactory(LOGGER, injectableClass(LoggerService), SINGLETON);
  container.bindFactory(CONFIG, injectableClass(ConfigService), SINGLETON);
  container.bindFactory(METRICS, injectableClass(MetricsService, LOGGER), SINGLETON);
  container.bindFactory(CACHE, injectableClass(CacheService, LOGGER, CONFIG), SINGLETON);
  container.bindFactory(HTTP, injectableClass(HttpClient, LOGGER, CONFIG), SINGLETON);
  container.bindFactory(USER_REPOSITORY, injectableClass(UserRepository, HTTP, CACHE, LOGGER), SINGLETON);
  container.bindFactory(ORDER_REPOSITORY, injectableClass(OrderRepository, HTTP, CACHE, LOGGER), SINGLETON);
  container.bindFactory(USER_SERVICE, injectableClass(UserService, USER_REPOSITORY, METRICS, LOGGER), SINGLETON);
  container.bindFactory(
    ORDER_SERVICE,
    injectableClass(OrderService, ORDER_REPOSITORY, USER_SERVICE, METRICS, LOGGER),
    SINGLETON,
  );
  container.bindFactory(API_CONTROLLER, injectableClass(ApiController, ORDER_SERVICE, USER_SERVICE, LOGGER), TRANSIENT);
  return container;
}

function sanityCheckClassGraph(): boolean {
  const container = buildClassContainer();
  return isRealisticClassGraphWellFormed(
    REALISTIC_GRAPH,
    container.resolve(API_CONTROLLER),
    container.resolve(API_CONTROLLER),
  );
}

function buildClassResolveRootScenario(): BenchScenario {
  const container = buildClassContainer();
  container.resolve(API_CONTROLLER);

  return {
    ...REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
    what: "resolve the transient root of the 10-node graph as injectableClass() factories bound per token",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: sanityCheckClassGraph,
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve(API_CONTROLLER);
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
        buildClassContainer().resolve(API_CONTROLLER);
      };
    },
  };
}

/**
 * Builds the class-lane realistic scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
