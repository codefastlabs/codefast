/**
 * injection-js — the app-boot row: the forty-service graph as `@Injectable()` classes with an `@Inject(Class)` per
 * parameter, applied as calls; a fresh injector over the singleton classes, and each transient handler instantiated
 * through `instantiateResolved` over them.
 */
import "reflect-metadata";
import type { ResolvedReflectiveProvider } from "injection-js";
import { Inject, Injectable, ReflectiveInjector } from "injection-js";

import type { AppGraphDescriptor, AppNodeClass } from "#fixtures/app-graph";
import { APP_GRAPH, appNodeClass, isAppGraphWellFormed } from "#fixtures/app-graph";
import type { RealisticNode } from "#fixtures/realistic-graph";
import { APP_BOOT_40 } from "#fixtures/scenario-parity";
import type { BenchScenario } from "#scenarios/types";

// Decorated once, as an application's classes are at module load; a boot only provides and resolves them.
function defineClasses(graph: AppGraphDescriptor): ReadonlyMap<string, AppNodeClass> {
  const classes = new Map<string, AppNodeClass>();
  for (const node of graph.nodes) {
    const nodeClass = appNodeClass(node.id);
    node.dependencies.forEach((dependencyId, index) => {
      Inject(classes.get(dependencyId)!)(nodeClass, undefined, index);
    });
    Injectable()(nodeClass);
    classes.set(node.id, nodeClass);
  }
  return classes;
}

interface BootedInjector {
  readonly injector: ReflectiveInjector;
  readonly handlerProviders: ReadonlyArray<ResolvedReflectiveProvider>;
}

// injection-js caches every provider per injector, so a transient handler is a resolved provider instantiated anew.
function bootInjector(
  singletonClasses: ReadonlyArray<AppNodeClass>,
  handlerClasses: ReadonlyArray<AppNodeClass>,
): BootedInjector {
  return {
    injector: ReflectiveInjector.resolveAndCreate([...singletonClasses]),
    handlerProviders: ReflectiveInjector.resolve([...handlerClasses]),
  };
}

function instantiateHandlers({ injector, handlerProviders }: BootedInjector): Array<RealisticNode> {
  return handlerProviders.map((provider) => injector.instantiateResolved(provider) as RealisticNode);
}

function buildAppBootScenario(): BenchScenario {
  const classes = defineClasses(APP_GRAPH);
  const singletonClasses = APP_GRAPH.nodes
    .filter((node) => node.lifetime === "singleton")
    .map((node) => classes.get(node.id)!);
  const handlerClasses = APP_GRAPH.handlerIds.map((id) => classes.get(id)!);

  return {
    ...APP_BOOT_40,
    what: "resolveAndCreate() an injector over 32 singleton classes and instantiateResolved() all 8 handler providers once",
    batch: 1,
    sanity: () => {
      const booted = bootInjector(singletonClasses, handlerClasses);
      return isAppGraphWellFormed(APP_GRAPH, instantiateHandlers(booted), instantiateHandlers(booted));
    },
    build: () => () => {
      instantiateHandlers(bootInjector(singletonClasses, handlerClasses));
    },
  };
}

/**
 * Builds the app-boot scenario.
 */
export function buildInjectionJsAppBootScenarios(): ReadonlyArray<BenchScenario> {
  return [buildAppBootScenario()];
}
