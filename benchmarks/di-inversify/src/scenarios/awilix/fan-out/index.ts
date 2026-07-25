import { buildAwilixFanOutTreeScenarios } from "#/scenarios/awilix/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

/**
 * @since 0.5.0-canary.7
 */
export function buildAwilixFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [...buildAwilixFanOutTreeScenarios()];
}
