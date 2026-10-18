/**
 * InversifyJS 8 — the app-boot row: the forty-service graph as `@injectable()` classes with an `@inject(Class)` per
 * parameter, applied through `decorate()`, every class bound `toSelf()`.
 */
import "reflect-metadata";
import { Container, decorate, inject, injectable } from "inversify";

import type { AppGraphDescriptor, AppNodeClass } from "#fixtures/app-graph";
import { APP_GRAPH, appNodeClass, isAppGraphWellFormed } from "#fixtures/app-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

// Decorated once, as an application's classes are at module load; a boot only binds and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, AppNodeClass> {
  const classes = new Map<string, AppNodeClass>();
  for (const node of graph.nodes) {
    const nodeClass = appNodeClass(node.id);
    decorate(injectable(), nodeClass);
    node.dependencies.forEach((dependencyId, index) => {
      decorate(inject(classes.get(dependencyId)!), nodeClass, index);
    });
    classes.set(node.id, nodeClass);
  }
  return classes;
}

function bootContainer(graph: AppGraphDescriptor, classes: ReadonlyMap<string, AppNodeClass>): Container {
  const container = new Container({ jitless: false });
  for (const node of graph.nodes) {
    const nodeClass = classes.get(node.id)!;
    if (node.lifetime === "singleton") {
      container.bind(nodeClass).toSelf().inSingletonScope();
    } else {
      container.bind(nodeClass).toSelf().inTransientScope();
    }
  }
  return container;
}

function buildAppBootScenario(): BenchScenario {
  const classes = defineClasses(APP_GRAPH);
  const handlers = APP_GRAPH.handlerIds.map((id) => classes.get(id)!);

  return {
    ...APP_BOOT_40,
    what: "new Container(), bind the 40-service graph toSelf() as @injectable + @inject classes, get() all 8 handlers once",
    batch: 1,
    sanity: () => {
      const container = bootContainer(APP_GRAPH, classes);
      const first = handlers.map((handler) => container.get(handler));
      const second = handlers.map((handler) => container.get(handler));
      return isAppGraphWellFormed(APP_GRAPH, first, second);
    },
    build: () => () => {
      const container = bootContainer(APP_GRAPH, classes);
      for (const handler of handlers) {
        container.get(handler);
      }
    },
  };
}

/**
 * Builds the app-boot scenario.
 *
 * @since 0.11.0
 */
export function buildInversifyAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
