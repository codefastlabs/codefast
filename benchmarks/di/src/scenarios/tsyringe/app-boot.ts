/**
 * tsyringe — the app-boot row: the forty-service graph as `@injectable()` classes with an `@inject(Class)` per
 * parameter, applied as calls, every class registered `useClass` against itself in a fresh child container.
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import { container as tsyringeRootContainer, inject, injectable, Lifecycle } from "tsyringe";

import type { AppGraphDescriptor, AppNodeClass } from "#fixtures/app-graph";
import { APP_GRAPH, appNodeClass, isAppGraphWellFormed } from "#fixtures/app-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

const SINGLETON = { lifecycle: Lifecycle.Singleton };

// Decorated once, as an application's classes are at module load; a boot only registers and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, AppNodeClass> {
  const classes = new Map<string, AppNodeClass>();
  for (const node of graph.nodes) {
    const nodeClass = appNodeClass(node.id);
    node.dependencies.forEach((dependencyId, index) => {
      inject(classes.get(dependencyId)!)(nodeClass, undefined, index);
    });
    injectable()(nodeClass);
    classes.set(node.id, nodeClass);
  }
  return classes;
}

function bootContainer(graph: AppGraphDescriptor, classes: ReadonlyMap<string, AppNodeClass>): DependencyContainer {
  const container = tsyringeRootContainer.createChildContainer();
  for (const node of graph.nodes) {
    const nodeClass = classes.get(node.id)!;
    if (node.lifetime === "singleton") {
      container.register(nodeClass, { useClass: nodeClass }, SINGLETON);
    } else {
      container.register(nodeClass, { useClass: nodeClass });
    }
  }
  return container;
}

function buildAppBootScenario(): BenchScenario {
  const classes = defineClasses(APP_GRAPH);
  const handlers = APP_GRAPH.handlerIds.map((id) => classes.get(id)!);

  return {
    ...APP_BOOT_40,
    what: "createChildContainer(), register the 40-service graph useClass as @injectable + @inject classes, resolve() all 8 handlers once",
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
 *
 * @since 0.10.4
 */
export function buildTsyringeAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
