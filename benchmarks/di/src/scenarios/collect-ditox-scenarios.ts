/**
 * Central list of all ditox bench scenarios. Used by the bench subprocess.
 * Ditox is functional and token-based with singleton/transient scopes and real
 * container hierarchy (`createContainer(parent)`), so it covers the factory/
 * class-binding core subset, the depth-2 child-scope and per-request scoped rows,
 * the `resolveAll` strategy rows (via `bindMultiValue`), cold module composition
 * (`bindModule`), and the disposal row (`onRemoved`) — the codefast-only
 * introspection rows stay absent.
 */
import { buildDitoxFanOutScenarios } from "#/scenarios/ditox/fan-out";
import { buildDitoxLifecycleScenarios } from "#/scenarios/ditox/lifecycle";
import { buildDitoxMicroScenarios } from "#/scenarios/ditox/micro";
import { buildDitoxModuleScenarios } from "#/scenarios/ditox/module";
import { buildDitoxProductionScenarios } from "#/scenarios/ditox/production";
import { buildDitoxRealisticScenarios } from "#/scenarios/ditox/realistic";
import { buildDitoxRealisticClassScenarios } from "#/scenarios/ditox/realistic-class";
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
    ...buildDitoxRealisticClassScenarios(),
    ...buildDitoxFanOutScenarios(),
    ...buildDitoxModuleScenarios(),
    ...buildDitoxLifecycleScenarios(),
    ...buildDitoxScaleScenarios(),
    ...buildDitoxScopeScenarios(),
    ...buildDitoxProductionScenarios(),
  ];
}
