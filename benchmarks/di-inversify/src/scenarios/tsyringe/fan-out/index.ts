import { buildTsyringeFanOutTreeScenarios } from "#/scenarios/tsyringe/fan-out/tree";
import type { BenchScenario } from "#/scenarios/types";

export function buildTsyringeFanOutScenarios(): ReadonlyArray<BenchScenario> {
  return [...buildTsyringeFanOutTreeScenarios()];
}
