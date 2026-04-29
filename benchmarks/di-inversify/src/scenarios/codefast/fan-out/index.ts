import { buildCodefastResolveAllStrategiesScenarios } from "#/scenarios/codefast/fan-out/resolve-all-strategies";
import { buildCodefastFanOutTreeScenarios } from "#/scenarios/codefast/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

export function buildCodefastFanOutScenarios(): readonly BenchScenario[] {
  return [...buildCodefastFanOutTreeScenarios(), ...buildCodefastResolveAllStrategiesScenarios()];
}
