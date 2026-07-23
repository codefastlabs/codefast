/**
 * @codefast/di — scale scenario.
 *
 * The benchmark builds a large registry (512 bindings) and resolves the leaf
 * of a 512-step transient dependency chain on every measured iteration.
 */
import { Container, token } from "@codefast/di";

import { SCALE_CHAIN_SIZE, SCALE_DEEP_TRANSIENT_CHAIN_512 } from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildScaleDeepTransientChainScenario(): BenchScenario {
  const chainTokens = Array.from({ length: SCALE_CHAIN_SIZE }, (_value, chainIndex) =>
    token<number>(`bench-cf-scale-chain-${String(chainIndex)}`),
  );
  const container = Container.create();
  container.bind(chainTokens[0]!).toConstantValue(0);

  for (let chainIndex = 1; chainIndex < SCALE_CHAIN_SIZE; chainIndex++) {
    const previousChainToken = chainTokens[chainIndex - 1]!;
    const currentChainToken = chainTokens[chainIndex]!;
    container
      .bind(currentChainToken)
      .toDynamic((resolutionContext) => resolutionContext.resolve(previousChainToken) + 1)
      .transient();
  }

  const leafChainToken = chainTokens[SCALE_CHAIN_SIZE - 1]!;
  const expectedLeafValue = SCALE_CHAIN_SIZE - 1;
  container.resolve(leafChainToken);

  return {
    ...SCALE_DEEP_TRANSIENT_CHAIN_512,
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
  return [buildScaleDeepTransientChainScenario()];
}
