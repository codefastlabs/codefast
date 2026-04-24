/**
 * InversifyJS 8 — decorator-driven boot scenario.
 *
 * Mirrors {@link ../codefast/boot.ts}: each iteration builds a fresh
 * container, binds a decorated class graph, and resolves the root once.
 */
import "reflect-metadata";
import { Container, inject, injectable } from "inversify";
import type { BenchScenario } from "#/scenarios/types";

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
  const container = new Container();
  container.bind<BootConfig>(bootConfigIdentifier).to(BootConfig).inSingletonScope();
  container.bind<BootLogger>(bootLoggerIdentifier).to(BootLogger).inSingletonScope();
  container
    .bind<BootDatabaseClient>(bootDatabaseClientIdentifier)
    .to(BootDatabaseClient)
    .inSingletonScope();
  container.bind<BootCacheClient>(bootCacheClientIdentifier).to(BootCacheClient).inSingletonScope();
  container.bind<BootRepository>(bootRepositoryIdentifier).to(BootRepository).inSingletonScope();
  container
    .bind<BootMetricsCollector>(bootMetricsCollectorIdentifier)
    .to(BootMetricsCollector)
    .inSingletonScope();
  container.bind<BootService>(bootServiceIdentifier).to(BootService).inSingletonScope();
  container.bind<BootController>(bootControllerIdentifier).to(BootController).inSingletonScope();
  return container.get<BootController>(bootControllerIdentifier);
}

function buildBootDecoratedContainerScenario(): BenchScenario {
  return {
    id: "boot-decorated-container-build-and-resolve",
    group: "boot",
    what: "create container, bind decorated graph, resolve root once",
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

export function buildInversifyBootScenarios(): readonly BenchScenario[] {
  return [buildBootDecoratedContainerScenario()];
}
