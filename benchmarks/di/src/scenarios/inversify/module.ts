/**
 * InversifyJS 8 — module system scenarios. Parallel to
 * `../codefast/module.ts`.
 *
 * Inversify mapping:
 *   - `Module.create(name, setup)` → `new ContainerModule(({ bind }) => { ... })`
 *   - `container.load(...modules)` → `container.load(...modules)`
 *   - `container.unload(...modules)` → `container.unload(...modules)`
 *   - `Container.fromModules(...)` → no direct equivalent; approximated by
 *     `new Container({ jitless: false })` + `container.load(modules)` to match the cold-start shape.
 *   - `Module.fromBindings(name, declarations)` → a `ContainerModule` whose callback binds each one.
 */
import "reflect-metadata";
import { Container, ContainerModule } from "inversify";

import { isComposedModule, isSharedWithinScopeFreshAcross } from "#fixtures/sanity";
import {
  MODULE_BINDING_COUNT,
  MODULE_COLD_128,
  MODULE_COLD_FROM_MODULES,
  MODULE_LOAD_UNLOAD,
} from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

// ── shared identifiers ───────────────────────────────────────────────────────────────────────────────────────────────

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

// ── scenario 1: module load → resolve → unload per iteration ─────────────────────────────────────────────────────────

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
    const container = new Container({ jitless: false });
    container.load(infraModule, appModule);
    const service = container.get<ModuleService>(moduleServiceId);
    container.unload(appModule, infraModule);
    return service.name;
  }

  // Pre-warm
  runOneLoadCycle();

  return {
    ...MODULE_LOAD_UNLOAD,
    // inversify-specific wording — the shared descriptor supplies the paired id/group
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

// ── scenario 2: cold start from modules ──────────────────────────────────────────────────────────────────────────────

function buildModuleColdFromModulesScenario(): BenchScenario {
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

  function runOneColdStart(): string {
    // inversify has no `fromModules`; a fresh container + load(modules) matches the cold-start shape.
    const container = new Container({ jitless: false });
    container.load(infraModule, appModule);
    return container.get<ModuleService>(moduleServiceId).name;
  }

  // Pre-warm
  runOneColdStart();

  return {
    ...MODULE_COLD_FROM_MODULES,
    what: "new Container() + load(2 ContainerModules) + get root (cold start)",
    batch: 1,
    sanity: () =>
      runOneColdStart().startsWith("service@postgres://") &&
      isSharedWithinScopeFreshAcross(() => {
        const container = new Container({ jitless: false });
        container.load(infraModule, appModule);
        return [container.get<ModuleService>(moduleServiceId), container.get<ModuleService>(moduleServiceId)] as const;
      }),
    build: () => {
      return () => {
        runOneColdStart();
      };
    },
  };
}

// ── scenario 3: one module of many bindings, cold start ──────────────────────────────────────────────────────────────

interface ModuleValue {
  readonly id: number;
}

function buildModuleCold128Scenario(): BenchScenario {
  const singletonFrom = MODULE_BINDING_COUNT / 2;
  const valueIds = Array.from({ length: MODULE_BINDING_COUNT }, (_value, index) =>
    Symbol(`bench-inv-mod128-${String(index)}`),
  );
  const constants = valueIds.slice(0, singletonFrom).map((_valueId, index): ModuleValue => ({ id: index }));
  const factories = valueIds.slice(singletonFrom).map((_valueId, offset) => (): ModuleValue => ({
    id: singletonFrom + offset,
  }));
  const largeModule = new ContainerModule(({ bind }) => {
    for (const [index, valueId] of valueIds.entries()) {
      if (index < singletonFrom) {
        bind<ModuleValue>(valueId).toConstantValue(constants[index]!);
      } else {
        bind<ModuleValue>(valueId)
          .toDynamicValue(factories[index - singletonFrom]!)
          .inSingletonScope();
      }
    }
  });
  const lastId = valueIds[MODULE_BINDING_COUNT - 1]!;

  function composeContainer(): Container {
    const container = new Container({ jitless: false });
    container.load(largeModule);
    return container;
  }

  function runOneColdStart(): number {
    return composeContainer().get<ModuleValue>(lastId).id;
  }

  // Pre-warm
  runOneColdStart();

  return {
    ...MODULE_COLD_128,
    what: `new Container() + load(1 ContainerModule binding ${String(MODULE_BINDING_COUNT)} identifiers) + get the last (cold start)`,
    batch: 1,
    sanity: () =>
      isComposedModule(
        () => {
          const container = composeContainer();
          return (index) => container.get<ModuleValue>(valueIds[index]!);
        },
        MODULE_BINDING_COUNT,
        singletonFrom,
      ),
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
export function buildInversifyModuleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildModuleLoadUnloadScenario(), buildModuleColdFromModulesScenario(), buildModuleCold128Scenario()];
}
