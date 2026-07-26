/**
 * Awilix — scale scenario. Mirrors {@link ../codefast/scale.ts}: a deep
 * transient chain resolved from leaf to root each iteration.
 */
import type { AwilixContainer } from "awilix";
import { asFunction, asValue, createContainer, InjectionMode, Lifetime } from "awilix";

import type { ScenarioDescriptor } from "#/fixtures/scenario-parity";
import {
  SCALE_CHAIN_SIZE,
  SCALE_DEEP_TRANSIENT_CHAIN_512,
  SCALE_MID_CHAIN_SIZE,
  SCALE_MID_TRANSIENT_CHAIN_32,
} from "#/fixtures/scenario-parity";
import type { BenchScenario } from "#/scenarios/types";

function buildScaleTransientChainScenario(descriptor: ScenarioDescriptor, chainSize: number): BenchScenario {
  const chainNames = Array.from(
    { length: chainSize },
    (_value, chainIndex) => `scale-chain-${String(chainSize)}-${String(chainIndex)}`,
  );
  const container: AwilixContainer = createContainer({ injectionMode: InjectionMode.PROXY });
  container.register(chainNames[0]!, asValue(0));

  for (let chainIndex = 1; chainIndex < chainSize; chainIndex++) {
    const previousChainName = chainNames[chainIndex - 1]!;
    const currentChainName = chainNames[chainIndex]!;
    container.register(
      currentChainName,
      asFunction((): number => container.resolve<number>(previousChainName) + 1, { lifetime: Lifetime.TRANSIENT }),
    );
  }

  const leafChainName = chainNames[chainSize - 1]!;
  const expectedLeafValue = chainSize - 1;
  container.resolve(leafChainName);

  return {
    ...descriptor,
    batch: 1,
    sanity: () => container.resolve<number>(leafChainName) === expectedLeafValue,
    build: () => {
      return () => {
        container.resolve(leafChainName);
      };
    },
  };
}

/**
 * @since 0.5.0-canary.7
 */
export function buildAwilixScaleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    buildScaleTransientChainScenario(SCALE_MID_TRANSIENT_CHAIN_32, SCALE_MID_CHAIN_SIZE),
    buildScaleTransientChainScenario(SCALE_DEEP_TRANSIENT_CHAIN_512, SCALE_CHAIN_SIZE),
  ];
}
