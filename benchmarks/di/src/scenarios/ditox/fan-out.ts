/**
 * Ditox — fan-out scenarios: the transient resolution tree.
 */
import { buildDitoxRealisticContainer } from "#/fixtures/ditox-adapter";
import { FAN_OUT_TREE_DEPTH_3_BREADTH_4 } from "#/fixtures/fan-out-descriptor";
import type { RealisticNode } from "#/fixtures/realistic-graph";
import { FAN_OUT_TREE, FAN_OUT_TREE_BATCH } from "#/fixtures/scenario-parity";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildFanOutTreeDepthThreeBreadthFourScenario(): BenchScenario {
  const { container, rootToken } = buildDitoxRealisticContainer(FAN_OUT_TREE_DEPTH_3_BREADTH_4);
  const firstResolution: RealisticNode = container.resolve(rootToken);

  return {
    ...FAN_OUT_TREE,
    batch: FAN_OUT_TREE_BATCH,
    sanity: () =>
      firstResolution.__id === FAN_OUT_TREE_DEPTH_3_BREADTH_4.rootId &&
      firstResolution.resolvedDependencies.length === 4,
    build: () =>
      batched(FAN_OUT_TREE_BATCH, () => {
        container.resolve(rootToken);
      }),
  };
}

/**
 * Builds the ditox fan-out scenarios.
 */
export function buildDitoxFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [buildFanOutTreeDepthThreeBreadthFourScenario()];
}
