/**
 * Central list of all ditox bench scenarios. Used by the bench subprocess.
 * Ditox is functional and token-based with singleton/transient scopes and real
 * container hierarchy (`createContainer(parent)`), so it covers the factory/
 * class-binding core subset plus the depth-2 child-scope row — the codefast-only
 * introspection/lifecycle rows stay absent.
 */
import { buildDitoxFanOutScenarios } from "#/scenarios/ditox/fan-out";
import { buildDitoxMicroScenarios } from "#/scenarios/ditox/micro";
import { buildDitoxRealisticScenarios } from "#/scenarios/ditox/realistic";
import { buildDitoxScaleScenarios } from "#/scenarios/ditox/scale";
import { buildDitoxScopeScenarios } from "#/scenarios/ditox/scope";
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
    ...buildDitoxScopeScenarios(),
  ];
}
