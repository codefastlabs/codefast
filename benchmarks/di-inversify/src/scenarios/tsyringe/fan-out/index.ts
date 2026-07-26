import { buildTsyringeFanOutTreeScenarios } from "#/scenarios/tsyringe/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

/**
 * @since 0.5.0-canary.7
 */
export function buildTsyringeFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [...buildTsyringeFanOutTreeScenarios()];
}
