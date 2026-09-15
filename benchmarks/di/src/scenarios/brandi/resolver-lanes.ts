/**
 * Brandi — a transient creator receiving one constant through `injected()`, then a creator reaching
 * for the container directly.
 */
import { createContainer, injected, token } from "brandi";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { NESTED_CONTAINER_RESOLVE, NESTED_CONTEXT_RESOLVE, RESOLVER_LANE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface LaneDependency {
  readonly id: string;
}

function buildFactoryResolveScenario(descriptor: ScenarioDescriptor, viaContainer: boolean): BenchScenario {
  const DEPENDENCY = token<LaneDependency>(`bench-brandi-${descriptor.id}-dep`);
  const FACTORY = token<LaneDependency>(`bench-brandi-${descriptor.id}-factory`);
  const container = createContainer();
  container.bind(DEPENDENCY).toConstant({ id: "dep" });
  if (viaContainer) {
    const creator = (): LaneDependency => container.get(DEPENDENCY);
    container.bind(FACTORY).toInstance(creator).inTransientScope();
  } else {
    const creator = (dependency: LaneDependency): LaneDependency => dependency;
    injected(creator, DEPENDENCY);
    container.bind(FACTORY).toInstance(creator).inTransientScope();
  }
  container.get(FACTORY);

  return {
    ...descriptor,
    what: viaContainer
      ? "the same transient creator calling container.get() directly"
      : "get() a transient creator handed one constant through injected()",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.get(FACTORY).id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.get(FACTORY);
      }),
  };
}

/**
 * Builds brandi's resolver-lane scenarios.
 *
 * @since 0.8.0
 */
export function buildBrandiResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
  ];
}
