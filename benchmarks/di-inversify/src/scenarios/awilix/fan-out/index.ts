import { buildAwilixFanOutTreeScenarios } from "#/scenarios/awilix/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

export function buildAwilixFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [...buildAwilixFanOutTreeScenarios()];
}
