/**
 * tsyringe — fan-out scenarios: the transient resolution tree plus the `resolveAll()` rows.
 *
 * `resolve-all-strategies-*`: N `useValue` registrations under one token, then
 * `resolveAll()` — which **rebuilds** the array each call, the same shape as
 * `@codefast/di`'s `resolveAll` and Inversify's `getAll`.
 */
import "reflect-metadata";
import { container as tsyringeRootContainer } from "tsyringe";

import { FAN_OUT_TREE_DEPTH_3_BREADTH_4, RESOLVE_ALL_STRATEGY_COUNTS } from "#/fixtures/fan-out-descriptor";
import type { ResolveAllStrategyCount } from "#/fixtures/fan-out-descriptor";
import type { RealisticNode } from "#/fixtures/realistic-graph";
import { isCompleteCollection } from "#/fixtures/sanity";
import {
  FAN_OUT_TREE,
  FAN_OUT_TREE_BATCH,
  resolveAllColdDescriptor,
  resolveAllStrategiesDescriptor,
} from "#/fixtures/scenario-parity";
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

function buildResolveAllStrategiesScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = "bench-tsyringe-fanout-resolve-all-strategy";
  const container = tsyringeRootContainer.createChildContainer();
  for (let index = 0; index < strategyCount; index++) {
    container.register<number>(strategyToken, { useValue: index });
  }
  container.resolveAll<number>(strategyToken);

  return {
    ...resolveAllStrategiesDescriptor(strategyCount),
    what: `resolveAll() across ${String(strategyCount)} strategy bindings once`,
    batch: 1,
    sanity: () => isCompleteCollection(container.resolveAll<number>(strategyToken), strategyCount),
    build: () => {
      return () => {
        const strategies = container.resolveAll<number>(strategyToken);
        if (strategies.length !== strategyCount) {
          throw new Error(`Expected ${String(strategyCount)} strategies, received ${String(strategies.length)}`);
        }
      };
    },
  };
}

function buildResolveAllColdScenario(strategyCount: ResolveAllStrategyCount): BenchScenario {
  const strategyToken = "bench-tsyringe-fanout-resolve-all-cold";
  function buildAndRead(): ReadonlyArray<number> {
    const container = tsyringeRootContainer.createChildContainer();
    for (let index = 0; index < strategyCount; index++) {
      container.register<number>(strategyToken, { useValue: index });
    }
    return container.resolveAll<number>(strategyToken);
  }
  const buildAndReadOnce = (): number => buildAndRead().length;
  buildAndReadOnce();

  return {
    ...resolveAllColdDescriptor(strategyCount),
    what: `createChildContainer(), register ${String(strategyCount)} strategies, resolveAll() once (cold collection)`,
    batch: 1,
    sanity: () => isCompleteCollection(buildAndRead(), strategyCount),
    build: () => {
      return () => {
        if (buildAndReadOnce() !== strategyCount) {
          throw new Error(`Expected ${String(strategyCount)} strategies from a cold container`);
        }
      };
    },
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function buildTsyringeFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildFanOutTreeDepthThreeBreadthFourScenario(),
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) => buildResolveAllStrategiesScenario(strategyCount)),
    ...RESOLVE_ALL_STRATEGY_COUNTS.map((strategyCount) => buildResolveAllColdScenario(strategyCount)),
  ];
}
