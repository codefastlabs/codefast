/**
 * injection-js — the realistic graph as constructor-injected classes: `@Injectable()` with an
 * explicit `@Inject(Class)` per parameter, class providers per injector, and the transient root
 * instantiated fresh through `instantiateResolved` over the cached singletons.
 */
import "reflect-metadata";
import type { ResolvedReflectiveProvider } from "injection-js";
import { Inject, Injectable, ReflectiveInjector } from "injection-js";

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

@Injectable()
class LoggerService implements RealisticNode {
  readonly __id = "LoggerService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode> = [];
}

@Injectable()
class ConfigService implements RealisticNode {
  readonly __id = "ConfigService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode> = [];
}

@Injectable()
class MetricsService implements RealisticNode {
  readonly __id = "MetricsService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [logger];
  }
}

@Injectable()
class CacheService implements RealisticNode {
  readonly __id = "CacheService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(ConfigService)
    config: ConfigService,
  ) {
    this.resolvedDependencies = [logger, config];
  }
}

@Injectable()
class HttpClient implements RealisticNode {
  readonly __id = "HttpClient";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(ConfigService)
    config: ConfigService,
  ) {
    this.resolvedDependencies = [logger, config];
  }
}

@Injectable()
class UserRepository implements RealisticNode {
  readonly __id = "UserRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(HttpClient)
    http: HttpClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(CacheService)
    cache: CacheService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

@Injectable()
class OrderRepository implements RealisticNode {
  readonly __id = "OrderRepository";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(HttpClient)
    http: HttpClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(CacheService)
    cache: CacheService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [http, cache, logger];
  }
}

@Injectable()
class UserService implements RealisticNode {
  readonly __id = "UserService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(UserRepository)
    users: UserRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(MetricsService)
    metrics: MetricsService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [users, metrics, logger];
  }
}

@Injectable()
class OrderService implements RealisticNode {
  readonly __id = "OrderService";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(OrderRepository)
    orders: OrderRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(UserService)
    users: UserService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(MetricsService)
    metrics: MetricsService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [orders, users, metrics, logger];
  }
}

@Injectable()
class ApiController implements RealisticNode {
  readonly __id = "ApiController";
  readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(OrderService)
    orders: OrderService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(UserService)
    users: UserService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(LoggerService)
    logger: LoggerService,
  ) {
    this.resolvedDependencies = [orders, users, logger];
  }
}

const SINGLETON_CLASSES = [
  LoggerService,
  ConfigService,
  MetricsService,
  CacheService,
  HttpClient,
  UserRepository,
  OrderRepository,
  UserService,
  OrderService,
];

function resolvedRootProvider(): ResolvedReflectiveProvider {
  const resolved = ReflectiveInjector.resolve([ApiController])[0];
  if (resolved === undefined) {
    throw new Error("injection-js: the ApiController provider failed to resolve");
  }
  return resolved;
}

function instantiateRoot(injector: ReflectiveInjector, provider: ResolvedReflectiveProvider): RealisticNode {
  return injector.instantiateResolved(provider) as RealisticNode;
}

function sanityCheckClassGraph(): boolean {
  const injector = ReflectiveInjector.resolveAndCreate(SINGLETON_CLASSES);
  const provider = resolvedRootProvider();
  return isRealisticClassGraphWellFormed(
    REALISTIC_GRAPH,
    instantiateRoot(injector, provider),
    instantiateRoot(injector, provider),
  );
}

function buildClassResolveRootScenario(): BenchScenario {
  const injector = ReflectiveInjector.resolveAndCreate(SINGLETON_CLASSES);
  const provider = resolvedRootProvider();
  instantiateRoot(injector, provider);

  return {
    ...REALISTIC_GRAPH_CLASS_RESOLVE_ROOT,
    what: "instantiateResolved() a fresh @Injectable + @Inject root over the injector's cached singleton classes",
    batch: REALISTIC_RESOLVE_BATCH,
    sanity: sanityCheckClassGraph,
    build: () =>
      batched(REALISTIC_RESOLVE_BATCH, () => {
        injector.instantiateResolved(provider);
      }),
  };
}

function buildClassColdResolveScenario(): BenchScenario {
  const allClasses = [...SINGLETON_CLASSES, ApiController];
  return {
    ...REALISTIC_GRAPH_CLASS_COLD_RESOLVE,
    what: "resolveAndCreate() a fresh injector over 10 class providers and get() the root once (cold start)",
    batch: 1,
    sanity: () => {
      const root = ReflectiveInjector.resolveAndCreate(allClasses).get(ApiController) as RealisticNode;
      return root.__id === REALISTIC_GRAPH.rootId && root.resolvedDependencies.length === 3;
    },
    build: () => {
      return () => {
        ReflectiveInjector.resolveAndCreate(allClasses).get(ApiController);
      };
    },
  };
}

/**
 * Builds the class-lane realistic scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsRealisticClassScenarios(): ReadonlyArray<BenchScenario> {
  return [buildClassResolveRootScenario(), buildClassColdResolveScenario()];
}
