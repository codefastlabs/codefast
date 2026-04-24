import "reflect-metadata";
import { buildInversifyRealisticContainer } from "#/fixtures/inversify-adapter";
import { FAN_OUT_TREE_DEPTH_3_BREADTH_4 } from "#/fixtures/fan-out-descriptor";
import { batched } from "#/harness/batched";
import { buildInversifyResolveAllStrategiesScenarios } from "#/scenarios/inversify/resolve-all-strategies";
import type { BenchScenario } from "#/scenarios/types";

const FAN_OUT_TREE_BATCH = 20;

function buildFanOutTreeDepthThreeBreadthFourScenario(): BenchScenario {
  const { container, rootIdentifier } = buildInversifyRealisticContainer(
    FAN_OUT_TREE_DEPTH_3_BREADTH_4,
  );
  const firstResolution = container.get(rootIdentifier);

  return {
    id: "fan-out-tree-depth-3-breadth-4",
    group: "fan-out",
    what: "resolve transient tree (depth 3, breadth 4; 21 nodes total)",
    batch: FAN_OUT_TREE_BATCH,
    sanity: () =>
      firstResolution.__id === FAN_OUT_TREE_DEPTH_3_BREADTH_4.rootId &&
      firstResolution.resolvedDependencies.length === 4,
    build: () =>
      batched(FAN_OUT_TREE_BATCH, () => {
        container.get(rootIdentifier);
      }),
  };
}

export function buildInversifyFanOutScenarios(): readonly BenchScenario[] {
  return [
    buildFanOutTreeDepthThreeBreadthFourScenario(),
    ...buildInversifyResolveAllStrategiesScenarios(),
  ];
}
