/**
 * Brandi — the app-boot row: the forty-service graph as plain classes wired with `injected()`, each bound
 * `toInstance()` under a token of its own.
 */
import type { Container, Token } from "brandi";
import { createContainer, injected, token } from "brandi";

import type { AppGraphDescriptor, AppNodeClass } from "#fixtures/app-graph";
import { APP_GRAPH, appNodeClass, isAppGraphWellFormed } from "#fixtures/app-graph";
import type { RealisticNode } from "#fixtures/realistic-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

interface WiredNode {
  readonly nodeClass: AppNodeClass;
  readonly nodeToken: Token<RealisticNode>;
}

// Wired once, as an application's classes are at module load; a boot only binds and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, WiredNode> {
  const wired = new Map<string, WiredNode>();
  for (const node of graph.nodes) {
    const nodeClass = appNodeClass(node.id);
    injected(nodeClass, ...node.dependencies.map((dependencyId) => wired.get(dependencyId)!.nodeToken));
    wired.set(node.id, { nodeClass, nodeToken: token<RealisticNode>(`bench-brandi-app-${node.id}`) });
  }
  return wired;
}

function bootContainer(graph: AppGraphDescriptor, wired: ReadonlyMap<string, WiredNode>): Container {
  const container = createContainer();
  for (const node of graph.nodes) {
    const { nodeClass, nodeToken } = wired.get(node.id)!;
    if (node.lifetime === "singleton") {
      container.bind(nodeToken).toInstance(nodeClass).inSingletonScope();
    } else {
      container.bind(nodeToken).toInstance(nodeClass).inTransientScope();
    }
  }
  return container;
}

function buildAppBootScenario(): BenchScenario {
  const wired = defineClasses(APP_GRAPH);
  const handlerTokens = APP_GRAPH.handlerIds.map((id) => wired.get(id)!.nodeToken);

  return {
    ...APP_BOOT_40,
    what: "createContainer(), bind the 40-service graph toInstance() as injected() classes, get() all 8 handlers once",
    batch: 1,
    sanity: () => {
      const container = bootContainer(APP_GRAPH, wired);
      const first = handlerTokens.map((handlerToken) => container.get(handlerToken));
      const second = handlerTokens.map((handlerToken) => container.get(handlerToken));
      return isAppGraphWellFormed(APP_GRAPH, first, second);
    },
    build: () => () => {
      const container = bootContainer(APP_GRAPH, wired);
      for (const handlerToken of handlerTokens) {
        container.get(handlerToken);
      }
    },
  };
}

/**
 * Builds the app-boot scenario.
 *
 * @since 0.11.0
 */
export function buildBrandiAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
