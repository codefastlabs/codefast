/**
 * Ditox — fan-out scenarios: the transient resolution tree plus the `resolveAll()` rows.
 *
 * `resolve-all-strategies-*`: ditox's native collection is `bindMultiValue`, and
 * `resolve()` returns a **cached** array — the same reference every call — so this
 * row measures cached-collection retrieval, not per-call assembly. The `what`
 * override names the mechanism so the caching shows against the rebuild libraries.
 */
import { bindMultiValue, createContainer, token } from "ditox";

import { buildDitoxRealisticContainer } from "#/fixtures/ditox-adapter";
import { FAN_OUT_TREE_DEPTH_3_BREADTH_4, RESOLVE_ALL_STRATEGY_COUNTS } from "#/fixtures/fan-out-descriptor";
import type { ResolveAllStrategyCount } from "#/fixtures/fan-out-descriptor";
import type { RealisticNode } from "#/fixtures/realistic-graph";
import { FAN_OUT_TREE, FAN_OUT_TREE_BATCH, resolveAllStrategiesDescriptor } from "#/fixtures/scenario-parity";
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

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = token<ReadonlyArray<number>>("bench-ditox-fanout-resolve-all-strategy");
  const container = createContainer();
  for (let index = 0; index < strategyCount; index++) {
    bindMultiValue(container, strategyToken, index);
  }
  const prewarmedStrategies = container.resolve(strategyToken);

  return {
    ...resolveAllStrategiesDescriptor(strategyCount),
    // ditox caches the bindMultiValue collection — resolve() hands back the same array.
    what: `resolve() a cached bindMultiValue collection across ${String(strategyCount)} bindings once`,
    batch: 1,
    sanity: () => prewarmedStrategies.length === strategyCount,
    build: () => {
      return () => {
        const strategies = container.resolve(strategyToken);
        if (strategies.length !== strategyCount) {
          throw new Error(`Expected ${String(strategyCount)} strategies, received ${String(strategies.length)}`);
        }
      };
    },
  };
}

/**
 * Builds the ditox fan-out scenarios.
 */
export function buildDitoxFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFanOutTreeDepthThreeBreadthFourScenario(),
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) => buildResolveAllStrategiesScenario(strategyCount)),
  ];
}
