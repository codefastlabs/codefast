/**
 * injection-js — the cold path: an empty injector, an empty child of a warm parent, and an injector
 * created over many factory providers with no `get()`. Binding and construction are one step here
 * (`resolveAndCreate` resolves every provider up front), which is the shape the row prices.
 */
import "reflect-metadata";
import type { FactoryProvider } from "injection-js";
import { Inject, Injectable, InjectionToken, ReflectiveInjector } from "injection-js";

import {
  BIND_128_PLAIN,
  BIND_TOKEN_COUNT,
  BOOT_DECORATED_CONTAINER_BUILD_AND_RESOLVE,
  CONTAINER_CREATE_BATCH,
  CONTAINER_CREATE_EMPTY,
  CREATE_CHILD_EMPTY,
} from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface BoundValue {
  readonly id: number;
}

const bindTokens = Array.from(
  { length: BIND_TOKEN_COUNT },
  (_value, index) => new InjectionToken<BoundValue>(`bench-injection-js-bind-path-${String(index)}`),
);

function buildBoundValue(): BoundValue {
  return { id: 1 };
}

const factoryProviders: Array<FactoryProvider> = bindTokens.map((bindToken) => ({
  provide: bindToken,
  useFactory: buildBoundValue,
  deps: [],
}));

function buildContainerCreateScenario(): BenchScenario {
  ReflectiveInjector.resolveAndCreate([]);

  return {
    ...CONTAINER_CREATE_EMPTY,
    what: "ReflectiveInjector.resolveAndCreate([]) — an injector with no providers",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => ReflectiveInjector.resolveAndCreate([]).get(bindTokens[0]!, null) === null,
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        ReflectiveInjector.resolveAndCreate([]);
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = ReflectiveInjector.resolveAndCreate([{ provide: bindTokens[0]!, useValue: { id: 0 } }]);
  parent.resolveAndCreateChild([]);

  return {
    ...CREATE_CHILD_EMPTY,
    what: "parent.resolveAndCreateChild([]) — a per-request child injector's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => (parent.resolveAndCreateChild([]).get(bindTokens[0]!) as BoundValue).id === 0,
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        parent.resolveAndCreateChild([]);
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  ReflectiveInjector.resolveAndCreate(factoryProviders);

  return {
    ...BIND_128_PLAIN,
    what: `resolveAndCreate() an injector over ${String(BIND_TOKEN_COUNT)} factory providers, no get() — registration is injector creation here`,
    batch: 1,
    sanity: () =>
      (ReflectiveInjector.resolveAndCreate(factoryProviders).get(bindTokens[BIND_TOKEN_COUNT - 1]!) as BoundValue)
        .id === 1,
    build: () => {
      return () => {
        ReflectiveInjector.resolveAndCreate(factoryProviders);
      };
    },
  };
}

@Injectable()
class BootConfig {
  readonly env = "production";
}

@Injectable()
class BootLogger {
  readonly sinkName: string;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootConfig)
    config: BootConfig,
  ) {
    this.sinkName = `log:${config.env}`;
  }
}

@Injectable()
class BootDatabaseClient {
  readonly poolName: string;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootConfig)
    config: BootConfig,
  ) {
    this.poolName = `db:${config.env}`;
  }
}

@Injectable()
class BootCacheClient {
  readonly cacheName: string;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootConfig)
    config: BootConfig,
  ) {
    this.cacheName = `cache:${config.env}`;
  }
}

@Injectable()
class BootRepository {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootDatabaseClient)
    readonly databaseClient: BootDatabaseClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootCacheClient)
    readonly cacheClient: BootCacheClient,
  ) {}
}

@Injectable()
class BootMetricsCollector {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootLogger)
    readonly logger: BootLogger,
  ) {}
}

@Injectable()
class BootService {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootRepository)
    readonly repository: BootRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootMetricsCollector)
    readonly metricsCollector: BootMetricsCollector,
  ) {}
}

@Injectable()
class BootController {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootService)
    readonly service: BootService,
    // @ts-ignore reflect-metadata + explicit token injection
    @Inject(BootLogger)
    readonly logger: BootLogger,
  ) {}
}

const BOOT_CLASSES = [
  BootConfig,
  BootLogger,
  BootDatabaseClient,
  BootCacheClient,
  BootRepository,
  BootMetricsCollector,
  BootService,
  BootController,
];

function buildBootInjectorAndResolveRoot(): BootController {
  return ReflectiveInjector.resolveAndCreate(BOOT_CLASSES).get(BootController) as BootController;
}

function buildBootDecoratedContainerScenario(): BenchScenario {
  return {
    ...BOOT_DECORATED_CONTAINER_BUILD_AND_RESOLVE,
    what: "resolveAndCreate() an injector over a decorated class graph and get() the root once",
    batch: 1,
    sanity: () => buildBootInjectorAndResolveRoot().service.repository.databaseClient.poolName === "db:production",
    build: () => {
      return () => {
        buildBootInjectorAndResolveRoot();
      };
    },
  };
}

/**
 * Builds injection-js's cold-path scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsBootScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildBootDecoratedContainerScenario(),
    buildContainerCreateScenario(),
    buildCreateChildScenario(),
    buildBindPlainScenario(),
  ];
}
