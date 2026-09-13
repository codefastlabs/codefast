/**
 * Ditox — a transient factory handed one constant through `injectable()`, then a factory resolving
 * it from the container it is passed.
 */
import { createContainer, injectable, token } from "ditox";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { NESTED_CONTAINER_RESOLVE, NESTED_CONTEXT_RESOLVE, RESOLVER_LANE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface LaneDependency {
  readonly id: string;
}

function buildFactoryResolveScenario(descriptor: ScenarioDescriptor, viaContainer: boolean): BenchScenario {
  const DEPENDENCY = token<LaneDependency>(`bench-ditox-${descriptor.id}-dep`);
  const FACTORY = token<LaneDependency>(`bench-ditox-${descriptor.id}-factory`);
  const container = createContainer();
  container.bindValue(DEPENDENCY, { id: "dep" });
  container.bindFactory(
    FACTORY,
    viaContainer
      ? (owner) => owner.resolve(DEPENDENCY)
      : injectable((dependency: LaneDependency): LaneDependency => dependency, DEPENDENCY),
    { scope: "transient" },
  );
  container.resolve(FACTORY);

  return {
    ...descriptor,
    what: viaContainer
      ? "the same transient factory calling resolve() on the container it is passed"
      : "resolve a transient injectable() factory handed one constant",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.resolve(FACTORY).id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.resolve(FACTORY);
      }),
  };
}

/**
 * Builds ditox's resolver-lane scenarios.
 */
export function buildDitoxResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
  ];
}
