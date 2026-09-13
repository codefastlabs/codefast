/**
 * Ditox — scale scenario. Mirrors `../codefast/scale.ts`: a deep transient
 * chain resolved from leaf to root each iteration. Each chain step binds a
 * transient factory that reads the previous step, so every step is rebuilt.
 */
import type { Container, Token } from "ditox";
import { createContainer, token } from "ditox";

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
    token<number>(`bench-ditox-scale-chain-${String(chainSize)}-${String(chainIndex)}`),
  );
  const container: Container = createContainer();
  container.bindValue(chainTokens[0]!, 0);

  for (let chainIndex = 1; chainIndex < chainSize; chainIndex++) {
    const previousChainToken = chainTokens[chainIndex - 1]!;
    container.bindFactory(chainTokens[chainIndex]!, (resolver) => resolver.resolve(previousChainToken) + 1, {
      scope: "transient",
    });
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
 * Builds the ditox scale scenarios.
 *
 * @since 0.8.0
 */
export function buildDitoxScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildScaleTransientChainScenario(SCALE_MID_TRANSIENT_CHAIN_32, SCALE_MID_CHAIN_SIZE),
    buildScaleTransientChainScenario(SCALE_DEEP_TRANSIENT_CHAIN_512, SCALE_CHAIN_SIZE),
  ];
}
