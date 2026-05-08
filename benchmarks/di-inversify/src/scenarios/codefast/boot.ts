/**
 * @codefast/di — decorator-driven boot scenario.
 *
 * Each measured iteration builds a fresh container, registers a small
 * decorator-based class graph, and resolves the root once.
 */
import { Container, injectable } from "@codefast/di";
import type { BenchScenario } from "#/scenarios/types";

@injectable()
class BootConfig {
  readonly env = "production";
}

@injectable([BootConfig])
class BootLogger {
  readonly sinkName: string;

  constructor(config: BootConfig) {
    this.sinkName = `log:${config.env}`;
  }
}

@injectable([BootConfig])
class BootDatabaseClient {
  readonly poolName: string;

  constructor(config: BootConfig) {
    this.poolName = `db:${config.env}`;
  }
}

@injectable([BootConfig])
class BootCacheClient {
  readonly cacheName: string;

  constructor(config: BootConfig) {
    this.cacheName = `cache:${config.env}`;
  }
}

@injectable([BootDatabaseClient, BootCacheClient])
class BootRepository {
  constructor(
    readonly databaseClient: BootDatabaseClient,
    readonly cacheClient: BootCacheClient,
  ) {}
}

@injectable([BootLogger])
class BootMetricsCollector {
  constructor(readonly logger: BootLogger) {}
}

@injectable([BootRepository, BootMetricsCollector])
class BootService {
  constructor(
    readonly repository: BootRepository,
    readonly metricsCollector: BootMetricsCollector,
  ) {}
}

@injectable([BootService, BootLogger])
class BootController {
  constructor(
    readonly service: BootService,
    readonly logger: BootLogger,
  ) {}
}

function buildBootContainerAndResolveRoot(): BootController {
  const container = Container.create();
  container.bind(BootConfig).to(BootConfig).singleton();
  container.bind(BootLogger).to(BootLogger).singleton();
  container.bind(BootDatabaseClient).to(BootDatabaseClient).singleton();
  container.bind(BootCacheClient).to(BootCacheClient).singleton();
  container.bind(BootRepository).to(BootRepository).singleton();
  container.bind(BootMetricsCollector).to(BootMetricsCollector).singleton();
  container.bind(BootService).to(BootService).singleton();
  container.bind(BootController).to(BootController).singleton();
  return container.resolve(BootController);
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

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildBootDecoratedContainerScenario()];
}
