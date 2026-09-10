/**
 * Brandi — module system scenario. Parallel to `../codefast/module.ts`.
 *
 * `module-cold-from-modules`: brandi groups bindings in a `DependencyModule` and a
 * container pulls them in with `container.use(...tokens).from(module)`. A fresh
 * container composes the two modules and resolves the root. Brandi has no
 * `load`/`unload`, so the load-unload row stays absent.
 */
import { createContainer, createDependencyModule, injected, token } from "brandi";

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

const moduleConfigToken = token<ModuleConfig>("bench-brandi-mod-config");
const moduleDbToken = token<ModuleDb>("bench-brandi-mod-db");
const moduleServiceToken = token<ModuleService>("bench-brandi-mod-service");

class ModuleDbImpl implements ModuleDb {
  readonly url: string;
  constructor(config: ModuleConfig) {
    this.url = `postgres://${config.env}/app`;
  }
}

class ModuleServiceImpl implements ModuleService {
  readonly name: string;
  constructor(db: ModuleDb) {
    this.name = `service@${db.url}`;
  }
}

injected(ModuleDbImpl, moduleConfigToken);
injected(ModuleServiceImpl, moduleDbToken);

// Modules are built once and reused; only the container is fresh per iteration — matching di's `fromModules` shape.
const infraModule = createDependencyModule();
infraModule.bind(moduleConfigToken).toConstant({ env: "production" });
infraModule.bind(moduleDbToken).toInstance(ModuleDbImpl).inSingletonScope();

const appModule = createDependencyModule();
appModule.bind(moduleServiceToken).toInstance(ModuleServiceImpl).inSingletonScope();

function buildModuleColdFromModulesScenario(): BenchScenario {
  function runOneColdStart(): string {
    const container = createContainer();
    container.use(moduleConfigToken, moduleDbToken).from(infraModule);
    container.use(moduleServiceToken).from(appModule);
    return container.get(moduleServiceToken).name;
  }

  // Pre-warm
  runOneColdStart();

  return {
    ...MODULE_COLD_FROM_MODULES,
    what: "createContainer() + use().from(2 dependency modules) + get root (cold start)",
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
 * Builds the brandi module scenarios.
 */
export function buildBrandiModuleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildModuleColdFromModulesScenario()];
}
