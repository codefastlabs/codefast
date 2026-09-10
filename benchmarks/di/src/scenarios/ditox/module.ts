/**
 * Ditox — module system scenario. Parallel to `../codefast/module.ts`.
 *
 * `module-cold-from-modules`: ditox modules are factory-based (`declareModule`-style
 * declarations with `factory`, `exports`, `imports`). A fresh container binds the app
 * module — whose `imports` pull in the infra module — then resolves the root. Ditox
 * has no `load`/`unload`, so the load-unload row stays absent.
 */
import { bindModule, createContainer, token } from "ditox";
import type { Module, ModuleDeclaration } from "ditox";

import { MODULE_COLD_FROM_MODULES } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

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

/**
 * Builds the ditox module scenarios.
 */
export function buildDitoxModuleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildModuleColdFromModulesScenario()];
}
