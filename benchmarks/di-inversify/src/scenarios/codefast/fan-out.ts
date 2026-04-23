import { Container, token } from "@codefast/di";
import { buildCodefastRealisticContainer } from "#/fixtures/codefast-adapter";
import {
  FAN_OUT_TREE_DEPTH_3_BREADTH_4,
  RESOLVE_ALL_STRATEGY_COUNTS,
  type ResolveAllStrategyCount,
} from "#/fixtures/fan-out-descriptor";
import { batched } from "#/harness/batched";
import type { BenchScenario } from "#/scenarios/types";

const FAN_OUT_TREE_BATCH = 20;

function buildFanOutTreeDepthThreeBreadthFourScenario(): BenchScenario {
  const { container, rootToken } = buildCodefastRealisticContainer(FAN_OUT_TREE_DEPTH_3_BREADTH_4);
  const firstResolution = container.resolve(rootToken);

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
        container.resolve(rootToken);
      }),
  };
}

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = token<number>("bench-cf-fanout-resolve-all-strategy");
  const container = Container.create();
  for (let index = 0; index < strategyCount; index++) {
    container
      .bind(strategyToken)
      .whenNamed(`strategy-${String(index)}`)
      .toConstantValue(index);
  }
  const prewarmedStrategies = container.resolveAll(strategyToken);

  return {
    id: `resolve-all-strategies-${String(strategyCount)}`,
    group: "fan-out",
    what: `resolveAll() across ${String(strategyCount)} strategy bindings once`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === strategyCount,
    build: () => {
      return () => {
        const strategies = container.resolveAll(strategyToken);
        if (strategies.length !== strategyCount) {
          throw new Error(
            `Expected ${String(strategyCount)} strategies, received ${String(strategies.length)}`,
          );
        }
      };
    },
  };
}

export function buildCodefastFanOutScenarios(): readonly BenchScenario[] {
  return [
    buildFanOutTreeDepthThreeBreadthFourScenario(),
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) =>
      buildResolveAllStrategiesScenario(strategyCount),
    ),
  ];
}
