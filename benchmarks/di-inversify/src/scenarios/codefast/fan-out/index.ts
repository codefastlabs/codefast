import { buildCodefastResolveAllStrategiesScenarios } from "#/scenarios/codefast/fan-out/resolve-all-strategies";
import { buildCodefastFanOutTreeScenarios } from "#/scenarios/codefast/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastFanOutScenarios(): readonly BenchScenario[] {
  return [...buildCodefastFanOutTreeScenarios(), ...buildCodefastResolveAllStrategiesScenarios()];
}
