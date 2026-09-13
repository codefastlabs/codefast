/**
 * tsyringe — a transient factory provider resolving one constant through the container it is
 * handed, then through the container closed over directly.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer } from "tsyringe";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { NESTED_CONTAINER_RESOLVE, NESTED_CONTEXT_RESOLVE, RESOLVER_LANE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface LaneDependency {
  readonly id: string;
}

function buildFactoryResolveScenario(descriptor: ScenarioDescriptor, viaContainer: boolean): BenchScenario {
  const dependencyToken = Symbol(`bench-tsyringe-${descriptor.id}-dep`);
  const factoryToken = Symbol(`bench-tsyringe-${descriptor.id}-factory`);
  const container = tsyringeRootContainer.createChildContainer();
  container.register<LaneDependency>(dependencyToken, { useValue: { id: "dep" } });
  container.register<LaneDependency>(factoryToken, {
    useFactory: viaContainer
      ? () => container.resolve<LaneDependency>(dependencyToken)
      : (dependencyContainer) => dependencyContainer.resolve<LaneDependency>(dependencyToken),
  });
  container.resolve(factoryToken);

  return {
    ...descriptor,
    what: viaContainer
      ? "the same factory provider calling the closed-over container's resolve() directly"
      : "resolve a factory provider that asks the container it is handed for one constant",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.resolve<LaneDependency>(factoryToken).id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.resolve(factoryToken);
      }),
  };
}

/**
 * Builds tsyringe's resolver-lane scenarios.
 */
export function buildTsyringeResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
  ];
}
