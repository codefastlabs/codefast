/**
 * Awilix — the realistic graph as classes: `asClass()` registrations whose constructors read their
 * dependencies off the proxy cradle, awilix's decorator-free class idiom.
 */
import type { AwilixContainer } from "awilix";
import { asClass, createContainer } from "awilix";

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

interface RealisticCradle {
  readonly loggerService: LoggerService;
  readonly configService: ConfigService;
  readonly metricsService: MetricsService;
  readonly cacheService: CacheService;
  readonly httpClient: HttpClient;
  readonly userRepository: UserRepository;
  readonly orderRepository: OrderRepository;
  readonly userService: UserService;
  readonly orderService: OrderService;
  readonly apiController: ApiController;
}

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
  constructor({ loggerService }: RealisticCradle) {
    this.resolvedDependencies = [loggerService];
  }
}

class CacheService implements RealisticNode {
  readonly __id = "CacheService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ loggerService, configService }: RealisticCradle) {
    this.resolvedDependencies = [loggerService, configService];
  }
}

class HttpClient implements RealisticNode {
  readonly __id = "HttpClient";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ loggerService, configService }: RealisticCradle) {
    this.resolvedDependencies = [loggerService, configService];
  }
}

class UserRepository implements RealisticNode {
  readonly __id = "UserRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ httpClient, cacheService, loggerService }: RealisticCradle) {
    this.resolvedDependencies = [httpClient, cacheService, loggerService];
  }
}

class OrderRepository implements RealisticNode {
  readonly __id = "OrderRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ httpClient, cacheService, loggerService }: RealisticCradle) {
    this.resolvedDependencies = [httpClient, cacheService, loggerService];
  }
}

class UserService implements RealisticNode {
  readonly __id = "UserService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ userRepository, metricsService, loggerService }: RealisticCradle) {
    this.resolvedDependencies = [userRepository, metricsService, loggerService];
  }
}

class OrderService implements RealisticNode {
  readonly __id = "OrderService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ orderRepository, userService, metricsService, loggerService }: RealisticCradle) {
    this.resolvedDependencies = [orderRepository, userService, metricsService, loggerService];
  }
}

class ApiController implements RealisticNode {
  readonly __id = "ApiController";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor({ orderService, userService, loggerService }: RealisticCradle) {
    this.resolvedDependencies = [orderService, userService, loggerService];
  }
}

function buildClassContainer(): AwilixContainer<RealisticCradle> {
  const container = createContainer<RealisticCradle>();
  container.register({
    loggerService: asClass(LoggerService).singleton(),
    configService: asClass(ConfigService).singleton(),
    metricsService: asClass(MetricsService).singleton(),
    cacheService: asClass(CacheService).singleton(),
    httpClient: asClass(HttpClient).singleton(),
    userRepository: asClass(UserRepository).singleton(),
    orderRepository: asClass(OrderRepository).singleton(),
    userService: asClass(UserService).singleton(),
    orderService: asClass(OrderService).singleton(),
    apiController: asClass(ApiController).transient(),
  });
  return container;
}

function sanityCheckClassGraph(): boolean {
  const container = buildClassContainer();
  return isRealisticClassGraphWellFormed(
    REALISTIC_GRAPH,
    container.resolve<ApiController>("apiController"),
    container.resolve<ApiController>("apiController"),
  );
}

function buildClassResolveRootScenario(): BenchScenario {
  const container = buildClassContainer();
  container.resolve<ApiController>("apiController");

  return {
    ...REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
    what: "resolve the transient root of the 10-node graph as asClass() registrations reading the proxy cradle",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: sanityCheckClassGraph,
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        container.resolve<ApiController>("apiController");
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
        buildClassContainer().resolve<ApiController>("apiController");
      };
    },
  };
}

/**
 * Builds the class-lane realistic scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
