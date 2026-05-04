/**
 * InversifyJS 8 — scale scenario.
 *
 * Mirrors {@link ../codefast/scale.ts}: 512 bindings with a deep transient
 * chain resolved from leaf to root each iteration.
 */
import "reflect-metadata";
import { Container } from "inversify";
import type { ServiceIdentifier } from "inversify";
import type { BenchScenario } from "#/scenarios/types";

const SCALE_CHAIN_SIZE = 512;

function buildScaleDeepTransientChainScenario(): BenchScenario {
  const chainIdentifiers = Array.from({ length: SCALE_CHAIN_SIZE }, (_value, chainIndex) =>
    Symbol(`bench-inv-scale-chain-${String(chainIndex)}`),
  ) as ServiceIdentifier<number>[];
  const container = new Container();
  container.bind<number>(chainIdentifiers[0]!).toConstantValue(0);

  for (let chainIndex = 1; chainIndex < SCALE_CHAIN_SIZE; chainIndex++) {
    const previousChainIdentifier = chainIdentifiers[chainIndex - 1]!;
    const currentChainIdentifier = chainIdentifiers[chainIndex]!;
    container
      .bind<number>(currentChainIdentifier)
      .toDynamicValue(
        (resolutionContext) => resolutionContext.get<number>(previousChainIdentifier) + 1,
      )
      .inTransientScope();
  }

  const leafChainIdentifier = chainIdentifiers[SCALE_CHAIN_SIZE - 1]!;
  const expectedLeafValue = SCALE_CHAIN_SIZE - 1;
  container.get(leafChainIdentifier);

  return {
    id: "scale-deep-transient-chain-512",
    group: "scale",
    what: "resolve a 512-step transient chain (500+ binding registry pressure)",
    batch: 1,
    sanity: () => container.get<number>(leafChainIdentifier) === expectedLeafValue,
    build: () => {
      return () => {
        container.get(leafChainIdentifier);
      };
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyScaleScenarios(): readonly BenchScenario[] {
  return [buildScaleDeepTransientChainScenario()];
}
