import { buildInversifyResolveAllStrategiesScenarios } from "#/scenarios/inversify/fan-out/resolve-all-strategies";
import { buildInversifyFanOutTreeScenarios } from "#/scenarios/inversify/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function buildInversifyFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [...buildInversifyFanOutTreeScenarios(), ...buildInversifyResolveAllStrategiesScenarios()];
}
