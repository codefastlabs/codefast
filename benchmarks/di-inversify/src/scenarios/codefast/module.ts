/**
 * @codefast/di — module system scenarios.
 *
 * Exercises `Module.create` / `container.load` / `container.unload` — the
 * primary app-organisation mechanism for grouping related bindings.  These
 * APIs have zero coverage in existing scenarios.
 *
 *   - `module-load-unload` — create a `SyncModule` with 4 bindings (config,
 *     logger, db, service), load it into a container, resolve the root service,
 *     then unload the module.  Each iteration repeats the full load → resolve →
 *     unload cycle, covering the module registry mutation + deactivation path.
 *
 *   - `module-cold-from-modules` — `Container.fromModules()` static factory:
 *     creates a fresh container from two pre-built modules and resolves the
 *     root service.  Each iteration repeats the full cold start, measuring the
 *     `fromModules` bootstrap cost including module dedup and binding commit.
 */
import { Container, Module, token } from "@codefast/di";
import type { BenchScenario } from "#/scenarios/types";

// ─── shared tokens ────────────────────────────────────────────────────────────

interface ModuleConfig {
  readonly env: string;
}

interface ModuleLogger {
  info(msg: string): void;
}

interface ModuleDb {
  readonly url: string;
}

interface ModuleService {
  readonly name: string;
}

const moduleConfigToken = token<ModuleConfig>("bench-cf-mod-config");
const moduleLoggerToken = token<ModuleLogger>("bench-cf-mod-logger");
const moduleDbToken = token<ModuleDb>("bench-cf-mod-db");
const moduleServiceToken = token<ModuleService>("bench-cf-mod-service");

// ─── scenario 1: module load → resolve → unload per iteration ─────────────────

function buildModuleLoadUnloadScenario(): BenchScenario {
  const infraModule = Module.create("bench-infra", (builder) => {
    builder.bind(moduleConfigToken).toConstantValue({ env: "production" });
    builder
      .bind(moduleLoggerToken)
      .toDynamic(() => ({ info: () => undefined }))
      .singleton();
    builder
      .bind(moduleDbToken)
      .toDynamic((ctx) => {
        const cfg = ctx.resolve(moduleConfigToken);
        return { url: `postgres://${cfg.env}/app` };
      })
      .singleton();
  });

  const appModule = Module.create("bench-app", (builder) => {
    builder
      .bind(moduleServiceToken)
      .toDynamic((ctx) => {
        const db = ctx.resolve(moduleDbToken);
        return { name: `service@${db.url}` };
      })
      .singleton();
  });

  function runOneLoadCycle(): string {
    const container = Container.create();
    container.load(infraModule, appModule);
    const service = container.resolve(moduleServiceToken);
    container.unload(appModule, infraModule);
    return service.name;
  }

  // Pre-warm
  runOneLoadCycle();

  return {
    id: "module-load-unload",
    group: "boot",
    what: "container.load(2 modules) → resolve root → container.unload() per iteration",
    batch: 1,
    sanity: () => {
      const result = runOneLoadCycle();
      return result.startsWith("service@postgres://");
    },
    build: () => {
      return () => {
        runOneLoadCycle();
      };
    },
  };
}

// ─── scenario 2: Container.fromModules cold start ─────────────────────────────

function buildModuleColdFromModulesScenario(): BenchScenario {
  const infraModule = Module.create("bench-infra-cold", (builder) => {
    builder.bind(moduleConfigToken).toConstantValue({ env: "production" });
    builder
      .bind(moduleLoggerToken)
      .toDynamic(() => ({ info: () => undefined }))
      .singleton();
    builder
      .bind(moduleDbToken)
      .toDynamic((ctx) => {
        const cfg = ctx.resolve(moduleConfigToken);
        return { url: `postgres://${cfg.env}/app` };
      })
      .singleton();
  });

  const appModule = Module.create("bench-app-cold", (builder) => {
    builder
      .bind(moduleServiceToken)
      .toDynamic((ctx) => {
        const db = ctx.resolve(moduleDbToken);
        return { name: `service@${db.url}` };
      })
      .singleton();
  });

  function runOneColdStart(): string {
    const container = Container.fromModules(infraModule, appModule);
    return container.resolve(moduleServiceToken).name;
  }

  // Pre-warm
  runOneColdStart();

  return {
    id: "module-cold-from-modules",
    group: "boot",
    what: "Container.fromModules(2 modules) fresh container build + resolve root (cold start)",
    batch: 1,
    sanity: () => {
      const result = runOneColdStart();
      return result.startsWith("service@postgres://");
    },
    build: () => {
      return () => {
        runOneColdStart();
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastModuleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildModuleLoadUnloadScenario(), buildModuleColdFromModulesScenario()];
}
