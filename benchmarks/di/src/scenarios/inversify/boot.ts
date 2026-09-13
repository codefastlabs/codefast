/**
 * InversifyJS 8 — boot scenarios: the decorated graph built and resolved per iteration, and the
 * cold path unbundled from a resolve — an empty container, an empty child, many bindings and no get.
 */
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";

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

const bindIdentifiers = Array.from({ length: BIND_TOKEN_COUNT }, (_value, index) =>
  Symbol(`bench-inv-bind-path-${String(index)}`),
);

function buildBoundValue(): BoundValue {
  return { id: 1 };
}

function buildContainerCreateScenario(): BenchScenario {
  new Container({ jitless: false });

  return {
    ...CONTAINER_CREATE_EMPTY,
    what: "new Container({ jitless: false }) with nothing bound",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => !new Container({ jitless: false }).isBound(bindIdentifiers[0]!),
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        new Container({ jitless: false });
      }),
  };
}

function buildCreateChildScenario(): BenchScenario {
  const parent = new Container({ jitless: false });
  parent.bind<BoundValue>(bindIdentifiers[0]!).toConstantValue({ id: 0 });
  new Container({ jitless: false, parent });

  return {
    ...CREATE_CHILD_EMPTY,
    what: "new Container({ parent }) with nothing bound — a per-request container's whole allocation",
    batch: CONTAINER_CREATE_BATCH,
    sanity: () => {
      const child = new Container({ jitless: false, parent });
      return child.isBound(bindIdentifiers[0]!) && !child.isCurrentBound(bindIdentifiers[0]!);
    },
    build: () =>
      batched(CONTAINER_CREATE_BATCH, () => {
        new Container({ jitless: false, parent });
      }),
  };
}

function buildBindPlainScenario(): BenchScenario {
  function bindAll(): Container {
    const container = new Container({ jitless: false });
    for (const identifier of bindIdentifiers) {
      container.bind<BoundValue>(identifier).toDynamicValue(buildBoundValue).inTransientScope();
    }
    return container;
  }
  bindAll();

  return {
    ...BIND_128_PLAIN,
    what: `bind ${String(BIND_TOKEN_COUNT)} transient toDynamicValue() identifiers into a fresh container, no get()`,
    batch: 1,
    sanity: () => bindAll().get<BoundValue>(bindIdentifiers[BIND_TOKEN_COUNT - 1]!).id === 1,
    build: () => {
      return () => {
        bindAll();
      };
    },
  };
}

const bootConfigIdentifier = Symbol("bench-inv-boot-config");
const bootLoggerIdentifier = Symbol("bench-inv-boot-logger");
const bootDatabaseClientIdentifier = Symbol("bench-inv-boot-db");
const bootCacheClientIdentifier = Symbol("bench-inv-boot-cache");
const bootRepositoryIdentifier = Symbol("bench-inv-boot-repository");
const bootMetricsCollectorIdentifier = Symbol("bench-inv-boot-metrics");
const bootServiceIdentifier = Symbol("bench-inv-boot-service");
const bootControllerIdentifier = Symbol("bench-inv-boot-controller");

@injectable()
class BootConfig {
  readonly env = "production";
}

@injectable()
class BootLogger {
  readonly sinkName: string;

  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootConfigIdentifier)
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
    @inject(bootConfigIdentifier)
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
    @inject(bootConfigIdentifier)
    config: BootConfig,
  ) {
    this.cacheName = `cache:${config.env}`;
  }
}

@injectable()
class BootRepository {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootDatabaseClientIdentifier)
    readonly databaseClient: BootDatabaseClient,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootCacheClientIdentifier)
    readonly cacheClient: BootCacheClient,
  ) {}
}

@injectable()
class BootMetricsCollector {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootLoggerIdentifier)
    readonly logger: BootLogger,
  ) {}
}

@injectable()
class BootService {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootRepositoryIdentifier)
    readonly repository: BootRepository,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootMetricsCollectorIdentifier)
    readonly metricsCollector: BootMetricsCollector,
  ) {}
}

@injectable()
class BootController {
  constructor(
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootServiceIdentifier)
    readonly service: BootService,
    // @ts-ignore reflect-metadata + explicit token injection
    @inject(bootLoggerIdentifier)
    readonly logger: BootLogger,
  ) {}
}

function buildBootContainerAndResolveRoot(): BootController {
  const container = new Container({ jitless: false });
  container.bind<BootConfig>(bootConfigIdentifier).to(BootConfig).inSingletonScope();
  container.bind<BootLogger>(bootLoggerIdentifier).to(BootLogger).inSingletonScope();
  container.bind<BootDatabaseClient>(bootDatabaseClientIdentifier).to(BootDatabaseClient).inSingletonScope();
  container.bind<BootCacheClient>(bootCacheClientIdentifier).to(BootCacheClient).inSingletonScope();
  container.bind<BootRepository>(bootRepositoryIdentifier).to(BootRepository).inSingletonScope();
  container.bind<BootMetricsCollector>(bootMetricsCollectorIdentifier).to(BootMetricsCollector).inSingletonScope();
  container.bind<BootService>(bootServiceIdentifier).to(BootService).inSingletonScope();
  container.bind<BootController>(bootControllerIdentifier).to(BootController).inSingletonScope();
  return container.get<BootController>(bootControllerIdentifier);
}

function buildBootDecoratedContainerScenario(): BenchScenario {
  return {
    ...BOOT_DECORATED_CONTAINER_BUILD_AND_RESOLVE,
    batch: 1,
    sanity: () => {
      const controller = buildBootContainerAndResolveRoot();
      return controller.service.repository.databaseClient.poolName === "db:production";
    },
    build: () => {
      return () => {
        buildBootContainerAndResolveRoot();
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyBootScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildBootDecoratedContainerScenario(),
    buildContainerCreateScenario(),
    buildCreateChildScenario(),
    buildBindPlainScenario(),
  ];
}
