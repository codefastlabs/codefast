/**
 * Awilix — the app-boot row: the forty-service graph as classes whose constructors read their dependencies off the
 * proxy cradle by registration name, all registered `asClass()` in one `register()` call.
 */
import type { AwilixContainer, Resolver } from "awilix";
import { asClass, createContainer } from "awilix";

import type { AppGraphDescriptor } from "#fixtures/app-graph";
import { APP_GRAPH, isAppGraphWellFormed } from "#fixtures/app-graph";
import type { RealisticNode } from "#fixtures/realistic-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

type AppCradle = Readonly<Record<string, RealisticNode>>;
type CradleClass = new (cradle: AppCradle) => RealisticNode;

/** The registration name of a node: its id, first letter lowercased, as awilix's own naming convention. */
function registrationName(id: string): string {
  return id.charAt(0).toLowerCase() + id.slice(1);
}

function cradleClass(id: string, dependencyNames: ReadonlyArray<string>): CradleClass {
  return class AppNode implements RealisticNode {
    readonly __id = id;
    readonly resolvedDependencies: ReadonlyArray<RealisticNode>;
    constructor(cradle: AppCradle) {
      this.resolvedDependencies = dependencyNames.map((name) => cradle[name]!);
    }
  };
}

// Defined once, as an application's classes are at module load; a boot only registers and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, CradleClass> {
  const classes = new Map<string, CradleClass>();
  for (const node of graph.nodes) {
    classes.set(node.id, cradleClass(node.id, node.dependencies.map(registrationName)));
  }
  return classes;
}

function bootContainer(
  graph: AppGraphDescriptor,
  classes: ReadonlyMap<string, CradleClass>,
): AwilixContainer<AppCradle> {
  const container = createContainer<AppCradle>();
  const registrations: Record<string, Resolver<RealisticNode>> = {};
  for (const node of graph.nodes) {
    const resolver = asClass(classes.get(node.id)!);
    registrations[registrationName(node.id)] =
      node.lifetime === "singleton" ? resolver.singleton() : resolver.transient();
  }
  container.register(registrations);
  return container;
}

function buildAppBootScenario(): BenchScenario {
  const classes = defineClasses(APP_GRAPH);
  const handlerNames = APP_GRAPH.handlerIds.map(registrationName);

  return {
    ...APP_BOOT_40,
    what: "createContainer(), register() the 40-service graph asClass() with cradle constructors, resolve() all 8 handlers once",
    batch: 1,
    sanity: () => {
      const container = bootContainer(APP_GRAPH, classes);
      const first = handlerNames.map((name) => container.resolve<RealisticNode>(name));
      const second = handlerNames.map((name) => container.resolve<RealisticNode>(name));
      return isAppGraphWellFormed(APP_GRAPH, first, second);
    },
    build: () => () => {
      const container = bootContainer(APP_GRAPH, classes);
      for (const name of handlerNames) {
        container.resolve(name);
      }
    },
  };
}

/**
 * Builds the app-boot scenario.
 *
 * @since 0.11.0
 */
export function buildAwilixAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
