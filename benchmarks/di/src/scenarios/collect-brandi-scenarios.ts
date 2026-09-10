/**
 * Central list of all brandi bench scenarios (core subset). Used by the bench
 * subprocess. Brandi is token-based and supports singleton and transient
 * scopes, so it covers the full factory/class-binding core subset shared by
 * every library, plus the conditional-injection row (its native `when`/`tagged`
 * form) — the codefast-only introspection/lifecycle rows are absent.
 */
import { buildBrandiConditionalScenarios } from "#/scenarios/brandi/conditional";
import { buildBrandiFanOutScenarios } from "#/scenarios/brandi/fan-out";
import { buildBrandiMicroScenarios } from "#/scenarios/brandi/micro";
import { buildBrandiModuleScenarios } from "#/scenarios/brandi/module";
import { buildBrandiRealisticScenarios } from "#/scenarios/brandi/realistic";
import { buildBrandiScaleScenarios } from "#/scenarios/brandi/scale";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every brandi bench scenario.
 */
export function collectAllBrandiScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildBrandiMicroScenarios(),
    ...buildBrandiRealisticScenarios(),
    ...buildBrandiFanOutScenarios(),
    ...buildBrandiConditionalScenarios(),
    ...buildBrandiModuleScenarios(),
    ...buildBrandiScaleScenarios(),
  ];
}
