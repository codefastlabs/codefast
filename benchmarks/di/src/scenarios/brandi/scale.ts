/**
 * Brandi — scale scenario. Mirrors `../codefast/scale.ts`: a deep transient
 * chain resolved from leaf to root each iteration. Each chain step binds a
 * transient factory that reads the previous step, so every step is rebuilt.
 */
import type { Container, Token } from "brandi";
import { createContainer, token } from "brandi";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  SCALE_CHAIN_SIZE,
  SCALE_DEEP_TRANSIENT_CHAIN_512,
  SCALE_MID_CHAIN_SIZE,
  SCALE_MID_TRANSIENT_CHAIN_32,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildScaleTransientChainScenario(descriptor: ScenarioDescriptor, chainSize: number): BenchScenario {
  const chainTokens: Array<Token<number>> = Array.from({ length: chainSize }, (_value, chainIndex) =>
    token<number>(`bench-brandi-scale-chain-${String(chainSize)}-${String(chainIndex)}`),
  );
  const container: Container = createContainer();
  container.bind(chainTokens[0]!).toConstant(0);

  for (let chainIndex = 1; chainIndex < chainSize; chainIndex++) {
    const previousChainToken = chainTokens[chainIndex - 1]!;
    container
      .bind(chainTokens[chainIndex]!)
      .toInstance(() => container.get(previousChainToken) + 1)
      .inTransientScope();
  }

  const leafChainToken = chainTokens[chainSize - 1]!;
  const expectedLeafValue = chainSize - 1;
  container.get(leafChainToken);

  return {
    ...descriptor,
    batch: 1,
    sanity: () => container.get(leafChainToken) === expectedLeafValue,
    build: () => {
      return () => {
        container.get(leafChainToken);
      };
    },
  };
}

/**
 * Builds the brandi scale scenarios.
 */
export function buildBrandiScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildScaleTransientChainScenario(SCALE_MID_TRANSIENT_CHAIN_32, SCALE_MID_CHAIN_SIZE),
    buildScaleTransientChainScenario(SCALE_DEEP_TRANSIENT_CHAIN_512, SCALE_CHAIN_SIZE),
  ];
}
