/**
 * Central list of all Awilix bench scenarios (core subset). Used by the bench
 * subprocess. Awilix supports the factory/class-binding core scenarios shared
 * by every library — the codefast-only introspection/lifecycle rows are absent.
 */
import { buildAwilixFanOutScenarios } from "#/scenarios/awilix/fan-out";
import { buildAwilixMicroScenarios } from "#/scenarios/awilix/micro";
import { buildAwilixRealisticScenarios } from "#/scenarios/awilix/realistic";
import { buildAwilixScaleScenarios } from "#/scenarios/awilix/scale";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.5.0-canary.7
 */
export function collectAllAwilixScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildAwilixMicroScenarios(),
    ...buildAwilixRealisticScenarios(),
    ...buildAwilixFanOutScenarios(),
    ...buildAwilixScaleScenarios(),
  ];
}
