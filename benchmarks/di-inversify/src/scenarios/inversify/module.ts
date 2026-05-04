/**
 * InversifyJS 8 — module system scenarios. Parallel to
 * {@link ../codefast/module.ts}.
 *
 * Inversify mapping:
 *   - `Module.create(name, setup)` → `new ContainerModule(({ bind }) => { ... })`
 *   - `container.load(...modules)` → `container.load(...modules)`
 *   - `container.unload(...modules)` → `container.unload(...modules)`
 *   - `Container.fromModules(...)` → no direct equivalent; approximated by
 *     `new Container()` + `container.load(modules)` to match the cold-start shape.
 *
 * Note: inversify's `ContainerModule` does NOT support the `module-cold-from-modules`
 * scenario ID (no `fromModules` static), so that row appears as codefast-only in
 * the comparison table.
 */
import "reflect-metadata";
import { Container, ContainerModule } from "inversify";
import type { BenchScenario } from "#/scenarios/types";

// ─── shared identifiers ───────────────────────────────────────────────────────

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

const moduleConfigId = Symbol("bench-inv-mod-config");
const moduleLoggerId = Symbol("bench-inv-mod-logger");
const moduleDbId = Symbol("bench-inv-mod-db");
const moduleServiceId = Symbol("bench-inv-mod-service");

// ─── scenario 1: module load → resolve → unload per iteration ─────────────────

function buildModuleLoadUnloadScenario(): BenchScenario {
  const infraModule = new ContainerModule(({ bind }) => {
    bind<ModuleConfig>(moduleConfigId).toConstantValue({ env: "production" });
    bind<ModuleLogger>(moduleLoggerId)
      .toDynamicValue(() => ({ info: () => undefined }))
      .inSingletonScope();
    bind<ModuleDb>(moduleDbId)
      .toDynamicValue((ctx) => {
        const cfg = ctx.get<ModuleConfig>(moduleConfigId);
        return { url: `postgres://${cfg.env}/app` };
      })
      .inSingletonScope();
  });

  const appModule = new ContainerModule(({ bind }) => {
    bind<ModuleService>(moduleServiceId)
      .toDynamicValue((ctx) => {
        const db = ctx.get<ModuleDb>(moduleDbId);
        return { name: `service@${db.url}` };
      })
      .inSingletonScope();
  });

  function runOneLoadCycle(): string {
    const container = new Container();
    container.load(infraModule, appModule);
    const service = container.get<ModuleService>(moduleServiceId);
    container.unload(appModule, infraModule);
    return service.name;
  }

  // Pre-warm
  runOneLoadCycle();

  return {
    id: "module-load-unload",
    group: "boot",
    what: "container.load(2 ContainerModules) → get root → container.unload() per iteration",
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

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyModuleScenarios(): readonly BenchScenario[] {
  return [buildModuleLoadUnloadScenario()];
}
