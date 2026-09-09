/**
 * Central list of all ditox bench scenarios (core subset). Used by the bench
 * subprocess. Ditox is functional and token-based and supports singleton and
 * transient scopes, so it covers the full factory/class-binding core subset
 * shared by every library — the codefast-only introspection/lifecycle rows are
 * absent.
 */
import { buildDitoxFanOutScenarios } from "#/scenarios/ditox/fan-out";
import { buildDitoxMicroScenarios } from "#/scenarios/ditox/micro";
import { buildDitoxRealisticScenarios } from "#/scenarios/ditox/realistic";
import { buildDitoxScaleScenarios } from "#/scenarios/ditox/scale";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every ditox bench scenario.
 */
export function collectAllDitoxScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildDitoxMicroScenarios(),
    ...buildDitoxRealisticScenarios(),
    ...buildDitoxFanOutScenarios(),
    ...buildDitoxScaleScenarios(),
  ];
}
