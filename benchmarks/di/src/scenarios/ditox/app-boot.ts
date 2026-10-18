/**
 * Ditox — the app-boot row: the forty-service graph as plain classes, each bound with `bindFactory` and
 * `injectableClass` under a token of its own, ditox's decorator-free class idiom.
 */
import type { Container, Token } from "ditox";
import { createContainer, injectableClass, token } from "ditox";

import type { AppGraphDescriptor, AppNodeClass } from "#fixtures/app-graph";
import { APP_GRAPH, appNodeClass, isAppGraphWellFormed } from "#fixtures/app-graph";
import type { RealisticNode } from "#fixtures/realistic-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

const SINGLETON = { scope: "singleton" } as const;
const TRANSIENT = { scope: "transient" } as const;

interface AppNodeSpec {
  readonly nodeClass: AppNodeClass;
  readonly nodeToken: Token<RealisticNode>;
  readonly dependencyTokens: ReadonlyArray<Token<RealisticNode>>;
}

// Classes and tokens exist once, as an application's do at module load; a boot binds and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, AppNodeSpec> {
  const specs = new Map<string, AppNodeSpec>();
  for (const node of graph.nodes) {
    specs.set(node.id, {
      nodeClass: appNodeClass(node.id),
      nodeToken: token<RealisticNode>(`bench-ditox-app-${node.id}`),
      dependencyTokens: node.dependencies.map((dependencyId) => specs.get(dependencyId)!.nodeToken),
    });
  }
  return specs;
}

function bootContainer(graph: AppGraphDescriptor, specs: ReadonlyMap<string, AppNodeSpec>): Container {
  const container = createContainer();
  for (const node of graph.nodes) {
    const { nodeClass, nodeToken, dependencyTokens } = specs.get(node.id)!;
    container.bindFactory(
      nodeToken,
      injectableClass(nodeClass, ...dependencyTokens),
      node.lifetime === "singleton" ? SINGLETON : TRANSIENT,
    );
  }
  return container;
}

function buildAppBootScenario(): BenchScenario {
  const specs = defineClasses(APP_GRAPH);
  const handlerTokens = APP_GRAPH.handlerIds.map((id) => specs.get(id)!.nodeToken);

  return {
    ...APP_BOOT_40,
    what: "createContainer(), bindFactory the 40-service graph with injectableClass(), resolve() all 8 handlers once",
    batch: 1,
    sanity: () => {
      const container = bootContainer(APP_GRAPH, specs);
      const first = handlerTokens.map((handlerToken) => container.resolve(handlerToken));
      const second = handlerTokens.map((handlerToken) => container.resolve(handlerToken));
      return isAppGraphWellFormed(APP_GRAPH, first, second);
    },
    build: () => () => {
      const container = bootContainer(APP_GRAPH, specs);
      for (const handlerToken of handlerTokens) {
        container.resolve(handlerToken);
      }
    },
  };
}

/**
 * Builds the app-boot scenario.
 *
 * @since 0.11.0
 */
export function buildDitoxAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
