/**
 * InversifyJS 8 — scale scenario.
 *
 * Mirrors {@link ../codefast/scale.ts}: 512 bindings with a deep transient
 * chain resolved from leaf to root each iteration.
 */
import "reflect-metadata";
import { Container } from "inversify";
import type { ServiceIdentifier } from "inversify";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  SCALE_CHAIN_SIZE,
  SCALE_DEEP_TRANSIENT_CHAIN_512,
  SCALE_MID_CHAIN_SIZE,
  SCALE_MID_TRANSIENT_CHAIN_32,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildScaleTransientChainScenario(descriptor: ScenarioDescriptor, chainSize: number): BenchScenario {
  const chainIdentifiers = Array.from({ length: chainSize }, (_value, chainIndex) =>
    Symbol(`bench-inv-scale-chain-${String(chainSize)}-${String(chainIndex)}`),
  ) as Array<ServiceIdentifier<number>>;
  const container = new Container({ jitless: false });
  container.bind<number>(chainIdentifiers[0]!).toConstantValue(0);

  for (let chainIndex = 1; chainIndex < chainSize; chainIndex++) {
    const previousChainIdentifier = chainIdentifiers[chainIndex - 1]!;
    const currentChainIdentifier = chainIdentifiers[chainIndex]!;
    container
      .bind<number>(currentChainIdentifier)
      .toDynamicValue((resolutionContext) => resolutionContext.get<number>(previousChainIdentifier) + 1)
      .inTransientScope();
  }

  const leafChainIdentifier = chainIdentifiers[chainSize - 1]!;
  const expectedLeafValue = chainSize - 1;
  container.get(leafChainIdentifier);

  return {
    ...descriptor,
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
export function buildInversifyScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildScaleTransientChainScenario(SCALE_MID_TRANSIENT_CHAIN_32, SCALE_MID_CHAIN_SIZE),
    buildScaleTransientChainScenario(SCALE_DEEP_TRANSIENT_CHAIN_512, SCALE_CHAIN_SIZE),
  ];
}
