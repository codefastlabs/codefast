/**
 * tsyringe — the cold path, unbundled from a resolve: a fresh child of the global root (tsyringe's
 * only way to make a container), an empty child of a warm parent, and many transient factory
 * registrations with no resolve.
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import { container as tsyringeRootContainer, inject, injectable, Lifecycle } from "tsyringe";

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

const bindTokens = Array.from({ length: BIND_TOKEN_COUNT }, (_value, index) =>
  Symbol(`bench-tsyringe-bind-path-${String(index)}`),
);

function buildBoundValue(): BoundValue {
  return { id: 1 };
}

function buildContainerCreateScenario(): BenchScenario {
  tsyringeRootContainer.createChildContainer();

  return {
    ...CONTAINER_CREATE_EMPTY,
    what: "root.createChildContainer() with nothing registered — tsyringe's only fresh container",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => !tsyringeRootContainer.createChildContainer().isRegistered(bindTokens[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        tsyringeRootContainer.createChildContainer();
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = tsyringeRootContainer.createChildContainer();
  parent.register<BoundValue>(bindTokens[0]!, { useValue: { id: 0 } });
  parent.createChildContainer();

  return {
    ...CREATE_CHILD_EMPTY,
    what: "parent.createChildContainer() with nothing registered — a per-request container's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => {
      const child = parent.createChildContainer();
      return child.isRegistered(bindTokens[0]!, true) && !child.isRegistered(bindTokens[0]!);
    },
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        parent.createChildContainer();
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  function bindAll(): DependencyContainer {
    const container = tsyringeRootContainer.createChildContainer();
    for (const bindToken of bindTokens) {
      container.register<BoundValue>(bindToken, { useFactory: buildBoundValue });
    }
    return container;
  }
  bindAll();

  return {
    ...BIND_128_PLAIN,
    what: `register ${String(BIND_TOKEN_COUNT)} factory providers into a fresh child container, no resolve`,
    batch: 1,
    sanity: () => bindAll().resolve<BoundValue>(bindTokens[BIND_TOKEN_COUNT - 1]!).id === 1,
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

@injectable()
class BootConfig {
  readonly env = "production";
}

@injectable()
class BootLogger {
  readonly sinkName: string;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootConfig)
    config: BootConfig,
  ) {
    this.sinkName = `log:${config.env}`;
  }
}

@injectable()
class BootDatabaseClient {
  readonly poolName: string;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootConfig)
    config: BootConfig,
  ) {
    this.poolName = `db:${config.env}`;
  }
}

@injectable()
class BootCacheClient {
  readonly cacheName: string;
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootConfig)
    config: BootConfig,
  ) {
    this.cacheName = `cache:${config.env}`;
  }
}

@injectable()
class BootRepository {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootDatabaseClient)
    readonly databaseClient: BootDatabaseClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootCacheClient)
    readonly cacheClient: BootCacheClient,
  ) {}
}

@injectable()
class BootMetricsCollector {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootLogger)
    readonly logger: BootLogger,
  ) {}
}

@injectable()
class BootService {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootRepository)
    readonly repository: BootRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootMetricsCollector)
    readonly metricsCollector: BootMetricsCollector,
  ) {}
}

@injectable()
class BootController {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootService)
    readonly service: BootService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(BootLogger)
    readonly logger: BootLogger,
  ) {}
}

const SINGLETON = { lifecycle: Lifecycle.Singleton };

function buildBootContainerAndResolveRoot(): BootController {
  const container = tsyringeRootContainer.createChildContainer();
  container.register(BootConfig, { useClass: BootConfig }, SINGLETON);
  container.register(BootLogger, { useClass: BootLogger }, SINGLETON);
  container.register(BootDatabaseClient, { useClass: BootDatabaseClient }, SINGLETON);
  container.register(BootCacheClient, { useClass: BootCacheClient }, SINGLETON);
  container.register(BootRepository, { useClass: BootRepository }, SINGLETON);
  container.register(BootMetricsCollector, { useClass: BootMetricsCollector }, SINGLETON);
  container.register(BootService, { useClass: BootService }, SINGLETON);
  container.register(BootController, { useClass: BootController }, SINGLETON);
  return container.resolve(BootController);
}

function buildBootDecoratedContainerScenario(): BenchScenario {
  return {
    ...BOOT_DECORATED_CONTAINER_BUILD_AND_RESOLVE,
    what: "createChildContainer(), register a decorated class graph as Singleton useClass, resolve root once",
    batch: 1,
    sanity: () => buildBootContainerAndResolveRoot().service.repository.databaseClient.poolName === "db:production",
    build: () => {
      return () => {
        buildBootContainerAndResolveRoot();
      };
    },
  };
}

/**
 * Builds tsyringe's cold-path scenarios.
 *
 * @since 0.8.0
 */
export function buildTsyringeBootScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildBootDecoratedContainerScenario(),
    buildContainerCreateScenario(),
    buildCreateChildScenario(),
    buildBindPlainScenario(),
  ];
}
