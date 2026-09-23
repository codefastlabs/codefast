/**
 * Brandi — module system scenario. Parallel to `../codefast/module.ts`.
 *
 * `module-cold-from-modules`: brandi groups bindings in a `DependencyModule` and a
 * container pulls them in with `container.use(...tokens).from(module)`. A fresh
 * container composes the two modules and resolves the root. Brandi has no
 * `load`/`unload`, so the load-unload row stays absent.
 *
 * `module-cold-128`: one dependency module of many bindings, every token pulled in
 * by a single `use(...).from(module)`.
 *
 * Both rows bind their singletons `inContainerScope()`, one per container: a module's
 * `inSingletonScope()` caches on the module's own binding, shared by every container that uses it.
 */
import { createContainer, createDependencyModule, injected, token } from "brandi";

import { isComposedModule, isSharedWithinScopeFreshAcross } from "#fixtures/sanity";
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
infraModule.bind(moduleDbToken).toInstance(ModuleDbImpl).inContainerScope();

const appModule = createDependencyModule();
appModule.bind(moduleServiceToken).toInstance(ModuleServiceImpl).inContainerScope();

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
    what: "createContainer() + use().from(2 dependency modules) + get root (cold start); singletons are inContainerScope(), one per container",
    batch: 1,
    sanity: () =>
      runOneColdStart().startsWith("service@postgres://") &&
      isSharedWithinScopeFreshAcross(() => {
        const container = createContainer();
        container.use(moduleConfigToken, moduleDbToken).from(infraModule);
        container.use(moduleServiceToken).from(appModule);
        return [container.get(moduleServiceToken), container.get(moduleServiceToken)] as const;
      }),
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

function buildModuleCold128Scenario(): BenchScenario {
  const singletonFrom = MODULE_BINDING_COUNT / 2;
  const valueTokens = Array.from({ length: MODULE_BINDING_COUNT }, (_value, index) =>
    token<ModuleValue>(`bench-brandi-mod128-${String(index)}`),
  );
  const largeModule = createDependencyModule();
  for (const [index, valueToken] of valueTokens.entries()) {
    if (index < singletonFrom) {
      largeModule.bind(valueToken).toConstant({ id: index });
    } else {
      largeModule
        .bind(valueToken)
        .toInstance((): ModuleValue => ({ id: index }))
        .inContainerScope();
    }
  }
  const lastToken = valueTokens[MODULE_BINDING_COUNT - 1]!;

  function composeContainer(): ReturnType<typeof createContainer> {
    const container = createContainer();
    container.use(...valueTokens).from(largeModule);
    return container;
  }

  function runOneColdStart(): number {
    return composeContainer().get(lastToken).id;
  }

  // Pre-warm
  runOneColdStart();

  return {
    ...MODULE_COLD_128,
    what: `createContainer() + use(${String(MODULE_BINDING_COUNT)} tokens).from(1 dependency module) + get the last (cold start); singletons are inContainerScope(), one per container`,
    batch: 1,
    sanity: () =>
      isComposedModule(
        () => {
          const container = composeContainer();
          return (index) => container.get(valueTokens[index]!);
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
 * Builds the brandi module scenarios.
 *
 * @since 0.8.0
 */
export function buildBrandiModuleScenarios(): ReadonlyArray<BenchScenario> {
  return [buildModuleColdFromModulesScenario(), buildModuleCold128Scenario()];
}
