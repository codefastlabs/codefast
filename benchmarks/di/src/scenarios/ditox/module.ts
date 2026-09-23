/**
 * Ditox — module system scenario. Parallel to `../codefast/module.ts`.
 *
 * `module-cold-from-modules`: ditox modules are factory-based (`declareModule`-style
 * declarations with `factory`, `exports`, `imports`). A fresh container binds the app
 * module — whose `imports` pull in the infra module — then resolves the root. Ditox
 * has no `load`/`unload`, so the load-unload row stays absent.
 *
 * `module-cold-128`: one module declaration exporting many tokens; its factory builds
 * the whole module object on the first resolve, as a ditox module always does.
 */
import { bindModule, createContainer, token } from "ditox";
import type { Module, ModuleDeclaration, Token } from "ditox";

import { isComposedModule } from "#fixtures/sanity";
import { MODULE_BINDING_COUNT, MODULE_COLD_128, MODULE_COLD_FROM_MODULES } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

interface ModuleConfig {
  readonly env: string;
}

interface ModuleDb {
  readonly url: string;
}

interface ModuleService {
  readonly name: string;
}

const moduleConfigToken = token<ModuleConfig>("bench-ditox-mod-config");
const moduleDbToken = token<ModuleDb>("bench-ditox-mod-db");
const moduleServiceToken = token<ModuleService>("bench-ditox-mod-service");

type InfraModule = Module<{ config: ModuleConfig; db: ModuleDb }>;
type AppModule = Module<{ service: ModuleService }>;

const infraModuleToken = token<InfraModule>("bench-ditox-infra-module");
const appModuleToken = token<AppModule>("bench-ditox-app-module");

const infraModule: ModuleDeclaration<InfraModule> = {
  token: infraModuleToken,
  factory: () => {
    const config: ModuleConfig = { env: "production" };
    return { config, db: { url: `postgres://${config.env}/app` } };
  },
  exports: { config: moduleConfigToken, db: moduleDbToken },
};

const appModule: ModuleDeclaration<AppModule> = {
  token: appModuleToken,
  imports: [infraModule],
  factory: (container) => ({ service: { name: `service@${container.resolve(moduleDbToken).url}` } }),
  exports: { service: moduleServiceToken },
};

function buildModuleColdFromModulesScenario(): BenchScenario {
  function runOneColdStart(): string {
    const container = createContainer();
    bindModule(container, appModule);
    return container.resolve(moduleServiceToken).name;
  }

  // Pre-warm
  runOneColdStart();

  return {
    ...MODULE_COLD_FROM_MODULES,
    what: "createContainer() + bindModule(app imports infra) + resolve root (cold start)",
    batch: 1,
    sanity: () => runOneColdStart().startsWith("service@postgres://"),
    build: () => {
      return () => {
        runOneColdStart();
      };
    },
  };
}

interface ModuleValue {
  readonly id: number;
}

type ModuleValueKey = `value${number}`;
type LargeModule = Module<Record<ModuleValueKey, ModuleValue>>;

function buildModuleCold128Scenario(): BenchScenario {
  const singletonFrom = MODULE_BINDING_COUNT / 2;
  const valueTokens = Array.from({ length: MODULE_BINDING_COUNT }, (_value, index) =>
    token<ModuleValue>(`bench-ditox-mod128-${String(index)}`),
  );
  const valueKeys = valueTokens.map((_valueToken, index): ModuleValueKey => `value${index}`);
  const constants = valueKeys.slice(0, singletonFrom).map((_valueKey, index): ModuleValue => ({ id: index }));
  const factories = valueKeys.slice(singletonFrom).map((_valueKey, offset) => (): ModuleValue => ({
    id: singletonFrom + offset,
  }));
  const exports: Record<ModuleValueKey, Token<ModuleValue>> = {};
  for (const [index, valueKey] of valueKeys.entries()) {
    exports[valueKey] = valueTokens[index]!;
  }
  const largeModule: ModuleDeclaration<LargeModule> = {
    token: token<LargeModule>("bench-ditox-mod128-module"),
    factory: () => {
      const values: Record<ModuleValueKey, ModuleValue> = {};
      for (const [index, valueKey] of valueKeys.entries()) {
        values[valueKey] = index < singletonFrom ? constants[index]! : factories[index - singletonFrom]!();
      }
      return values;
    },
    exports,
  };
  const lastToken = valueTokens[MODULE_BINDING_COUNT - 1]!;

  function composeContainer(): ReturnType<typeof createContainer> {
    const container = createContainer();
    bindModule(container, largeModule);
    return container;
  }

  function runOneColdStart(): number {
    return composeContainer().resolve(lastToken).id;
  }

  // Pre-warm
  runOneColdStart();

  return {
    ...MODULE_COLD_128,
    what: `createContainer() + bindModule(1 module exporting ${String(MODULE_BINDING_COUNT)} tokens) + resolve the last (cold start); the module factory builds every export at once`,
    batch: 1,
    sanity: () =>
      isComposedModule(
        () => {
          const container = composeContainer();
          return (index) => container.resolve(valueTokens[index]!);
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
 * Builds the ditox module scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxModuleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildModuleColdFromModulesScenario(), buildModuleCold128Scenario()];
}
