/**
 * Awilix — a transient factory resolving one constant through the proxy cradle it is handed, then
 * through the container directly.
 */
import { asFunction, asValue, createContainer } from "awilix";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import { NESTED_CONTAINER_RESOLVE, NESTED_CONTEXT_RESOLVE, RESOLVER_LANE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

interface LaneDependency {
  readonly id: string;
}

interface LaneCradle {
  readonly dependency: LaneDependency;
  readonly factory: LaneDependency;
}

function buildFactoryResolveScenario(descriptor: ScenarioDescriptor, viaContainer: boolean): BenchScenario {
  const container = createContainer<LaneCradle>();
  container.register({
    dependency: asValue<LaneDependency>({ id: "dep" }),
    factory: asFunction(
      viaContainer
        ? (): LaneDependency => container.resolve("dependency")
        : ({ dependency }: LaneCradle): LaneDependency => dependency,
    ).transient(),
  });
  container.resolve("factory");

  return {
    ...descriptor,
    what: viaContainer
      ? "the same transient asFunction() calling container.resolve() directly"
      : "resolve a transient asFunction() that reads one constant off the proxy cradle",
    batch: RESOLVER_LANE_BATCH,
    sanity: () => container.resolve("factory").id === "dep",
    build: () =>
      batched(RESOLVER_LANE_BATCH, () => {
        container.resolve("factory");
      }),
  };
}

/**
 * Builds Awilix's resolver-lane scenarios.
 *
 * @since 0.8.0
 */
export function buildAwilixResolverLaneScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFactoryResolveScenario(NESTED_CONTEXT_RESOLVE, false),
    buildFactoryResolveScenario(NESTED_CONTAINER_RESOLVE, true),
  ];
}
