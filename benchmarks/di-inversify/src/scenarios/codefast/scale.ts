/**
 * @codefast/di — scale scenario.
 *
 * The benchmark builds a large registry (512 bindings) and resolves the leaf
 * of a 512-step transient dependency chain on every measured iteration.
 */
import { Container, token } from "@codefast/di";

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
    token<number>(`bench-cf-scale-chain-${String(chainSize)}-${String(chainIndex)}`),
  );
  const container = Container.create();
  container.bind(chainTokens[0]!).toConstantValue(0);

  for (let chainIndex = 1; chainIndex < chainSize; chainIndex++) {
    const previousChainToken = chainTokens[chainIndex - 1]!;
    const currentChainToken = chainTokens[chainIndex]!;
    container
      .bind(currentChainToken)
      .toDynamic((resolutionContext) => resolutionContext.resolve(previousChainToken) + 1)
      .transient();
  }

  const leafChainToken = chainTokens[chainSize - 1]!;
  const expectedLeafValue = chainSize - 1;
  container.resolve(leafChainToken);

  return {
    ...descriptor,
    batch: 1,
    sanity: () => container.resolve(leafChainToken) === expectedLeafValue,
    build: () => {
      return () => {
        container.resolve(leafChainToken);
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildScaleTransientChainScenario(SCALE_MID_TRANSIENT_CHAIN_32, SCALE_MID_CHAIN_SIZE),
    buildScaleTransientChainScenario(SCALE_DEEP_TRANSIENT_CHAIN_512, SCALE_CHAIN_SIZE),
  ];
}
