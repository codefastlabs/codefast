/**
 * `@codefast/di` — the app-boot row: the forty-service graph as `@injectable([deps])` classes bound to themselves.
 */
import type { Constructor } from "@codefast/di";
import { Container, injectable } from "@codefast/di";

import type { AppGraphDescriptor } from "#fixtures/app-graph";
import { APP_GRAPH, isAppGraphWellFormed } from "#fixtures/app-graph";
import type { RealisticNode } from "#fixtures/realistic-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

type NodeClass = Constructor<RealisticNode>;

// Defined once, as an application defines its classes at module load; a boot only registers and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, NodeClass> {
  const classes = new Map<string, NodeClass>();
  for (const node of graph.nodes) {
    const id = node.id;
    const dependencies = node.dependencies.map((dependencyId) => classes.get(dependencyId)!);

    @injectable(dependencies)
    class AppNode implements RealisticNode {
      readonly __id = id;
      readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
      constructor(...resolved: Array<RealisticNode>) {
        this.resolvedDependencies = resolved;
      }
    }
    classes.set(id, AppNode);
  }
  return classes;
}

function bootContainer(graph: AppGraphDescriptor, classes: ReadonlyMap<string, NodeClass>): Container {
  const container = Container.create();
  for (const node of graph.nodes) {
    const nodeClass = classes.get(node.id)!;
    if (node.lifetime === "singleton") {
      container.bind(nodeClass).to(nodeClass).singleton();
    } else {
      container.bind(nodeClass).to(nodeClass).transient();
    }
  }
  return container;
}

function buildAppBootScenario(): BenchScenario {
  const classes = defineClasses(APP_GRAPH);
  const handlers = APP_GRAPH.handlerIds.map((id) => classes.get(id)!);

  return {
    ...APP_BOOT_40,
    what: "create a container, bind the 40-service graph as @injectable([deps]) classes, resolve all 8 handlers once",
    batch: 1,
    sanity: () => {
      const container = bootContainer(APP_GRAPH, classes);
      const first = handlers.map((handler) => container.resolve(handler));
      const second = handlers.map((handler) => container.resolve(handler));
      return isAppGraphWellFormed(APP_GRAPH, first, second);
    },
    build: () => () => {
      const container = bootContainer(APP_GRAPH, classes);
      for (const handler of handlers) {
        container.resolve(handler);
      }
    },
  };
}

/**
 * Builds the app-boot scenario.
 */
export function buildCodefastAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
