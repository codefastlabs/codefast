/**
 * tsyringe — scale scenario. Mirrors `../codefast/scale.ts`: a deep
 * transient chain resolved from leaf to root each iteration. tsyringe factory
 * providers don't cache, so every chain step is transient by construction.
 */
import "reflect-metadata";
import type { DependencyContainer } from "tsyringe";
import { container as rootContainer } from "tsyringe";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  SCALE_CHAIN_SIZE,
  SCALE_DEEP_TRANSIENT_CHAIN_512,
  SCALE_MID_CHAIN_SIZE,
  SCALE_MID_TRANSIENT_CHAIN_32,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildScaleTransientChainScenario(descriptor: ScenarioDescriptor, chainSize: number): BenchScenario {
  const chainTokens = Array.from({ length: chainSize }, (_value, chainIndex) =>
    Symbol(`bench-tsyringe-scale-chain-${String(chainSize)}-${String(chainIndex)}`),
  );
  const container: DependencyContainer = rootContainer.createChildContainer();
  container.register<number>(chainTokens[0]!, { useValue: 0 });

  for (let chainIndex = 1; chainIndex < chainSize; chainIndex++) {
    const previousChainToken = chainTokens[chainIndex - 1]!;
    container.register<number>(chainTokens[chainIndex]!, {
      useFactory: (dependencyContainer) => dependencyContainer.resolve<number>(previousChainToken) + 1,
    });
  }

  const leafChainToken = chainTokens[chainSize - 1]!;
  const expectedLeafValue = chainSize - 1;
  container.resolve<number>(leafChainToken);

  return {
    ...descriptor,
    batch: 1,
    sanity: () => container.resolve<number>(leafChainToken) === expectedLeafValue,
    build: () => {
      return () => {
        container.resolve<number>(leafChainToken);
      };
    },
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function buildTsyringeScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildScaleTransientChainScenario(SCALE_MID_TRANSIENT_CHAIN_32, SCALE_MID_CHAIN_SIZE),
    buildScaleTransientChainScenario(SCALE_DEEP_TRANSIENT_CHAIN_512, SCALE_CHAIN_SIZE),
  ];
}
