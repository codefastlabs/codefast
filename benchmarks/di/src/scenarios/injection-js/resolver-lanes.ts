/**
 * injection-js — a transient factory provider handed one constant through `deps`, then one handed
 * the `Injector` itself and calling `get()` on it. The root is instantiated fresh through
 * `instantiateResolved`, since every plain `get()` is cached per injector.
 */
import "reflect-metadata";
import type { ResolvedReflectiveProvider } from "injection-js";
import { InjectionToken, Injector, ReflectiveInjector } from "injection-js";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { NESTED_CONTAINER_RESOLVE, NESTED_CONTEXT_RESOLVE, RESOLVER_LANE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface LaneDependency {
  readonly id: string;
}

function buildFactoryResolveScenario(descriptor: ScenarioDescriptor, viaContainer: boolean): BenchScenario {
  const dependencyToken = new InjectionToken<LaneDependency>(`bench-injection-js-${descriptor.id}-dep`);
  const factoryToken = new InjectionToken<LaneDependency>(`bench-injection-js-${descriptor.id}-factory`);
  const injector = ReflectiveInjector.resolveAndCreate([{ provide: dependencyToken, useValue: { id: "dep" } }]);
  const resolvedProvider: ResolvedReflectiveProvider | undefined = ReflectiveInjector.resolve([
    viaContainer
      ? {
          provide: factoryToken,
          useFactory: (owner: Injector): LaneDependency => owner.get(dependencyToken),
          deps: [Injector],
        }
      : {
          provide: factoryToken,
          useFactory: (dependency: LaneDependency): LaneDependency => dependency,
          deps: [dependencyToken],
        },
  ])[0];
  if (resolvedProvider === undefined) {
    throw new Error("injection-js: the factory provider failed to resolve");
  }
  const instantiate = (): LaneDependency => injector.instantiateResolved(resolvedProvider) as LaneDependency;
  instantiate();

  return {
    ...descriptor,
    what: viaContainer
      ? "the same factory provider handed the Injector and calling get() on it"
      : "instantiateResolved() a factory provider handed one constant through deps",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => instantiate().id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        injector.instantiateResolved(resolvedProvider);
      }),
  };
}

/**
 * Builds injection-js's resolver-lane scenarios.
 *
 * @since 0.8.0
 */
export function buildInjectionJsResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
  ];
}
