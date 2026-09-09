/**
 * tsyringe — fan-out scenarios: the transient resolution tree.
 */
import "reflect-metadata";
import { FAN_OUT_TREE_DEPTH_3_BREADTH_4 } from "#/fixtures/fan-out-descriptor";
import type { RealisticNode } from "#/fixtures/realistic-graph";
import { FAN_OUT_TREE, FAN_OUT_TREE_BATCH } from "#/fixtures/scenario-parity";
import { buildTsyringeRealisticContainer } from "#/fixtures/tsyringe-adapter";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

function buildFanOutTreeDepthThreeBreadthFourScenario(): BenchScenario {
  const { container, rootToken } = buildTsyringeRealisticContainer(FAN_OUT_TREE_DEPTH_3_BREADTH_4);
  const firstResolution = container.resolve<RealisticNode>(rootToken);

  return {
    ...FAN_OUT_TREE,
    batch: FAN_OUT_TREE_BATCH,
    sanity: () =>
      firstResolution.__id === FAN_OUT_TREE_DEPTH_3_BREADTH_4.rootId &&
      firstResolution.resolvedDependencies.length === 4,
    build: () =>
      batched(FAN_OUT_TREE_BATCH, () => {
        container.resolve<RealisticNode>(rootToken);
      }),
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function buildTsyringeFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [buildFanOutTreeDepthThreeBreadthFourScenario()];
}
