import { buildInversifyResolveAllStrategiesScenarios } from "#/scenarios/inversify/fan-out/resolve-all-strategies";
import { buildInversifyFanOutTreeScenarios } from "#/scenarios/inversify/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

export function buildInversifyFanOutScenarios(): readonly BenchScenario[] {
  return [...buildInversifyFanOutTreeScenarios(), ...buildInversifyResolveAllStrategiesScenarios()];
}
