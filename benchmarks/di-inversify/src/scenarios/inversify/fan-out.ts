import "reflect-metadata";
import { Container } from "inversify";
import { batched } from "../../harness/batched";
import { buildInversifyRealisticContainer } from "../../fixtures/inversify-adapter";
import {
  FAN_OUT_TREE_DEPTH_3_BREADTH_4,
  RESOLVE_ALL_STRATEGY_COUNTS,
  type ResolveAllStrategyCount,
} from "../../fixtures/fan-out-descriptor";
import type { BenchScenario } from "../types";

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

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyIdentifier = Symbol("bench-inv-fanout-resolve-all-strategy");
  const container = new Container();
  for (let index = 0; index < strategyCount; index++) {
    container.bind<number>(strategyIdentifier).toConstantValue(index);
  }
  const prewarmedStrategies = container.getAll<number>(strategyIdentifier);

  return {
    id: `resolve-all-strategies-${String(strategyCount)}`,
    group: "fan-out",
    what: `resolveAll() across ${String(strategyCount)} strategy bindings once`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === strategyCount,
    build: () => {
      return () => {
        const strategies = container.getAll<number>(strategyIdentifier);
        if (strategies.length !== strategyCount) {
          throw new Error(
            `Expected ${String(strategyCount)} strategies, received ${String(strategies.length)}`,
          );
        }
      };
    },
  };
}

export function buildInversifyFanOutScenarios(): readonly BenchScenario[] {
  return [
    buildFanOutTreeDepthThreeBreadthFourScenario(),
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) =>
      buildResolveAllStrategiesScenario(strategyCount),
    ),
  ];
}
