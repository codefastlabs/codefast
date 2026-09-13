/**
 * Every brandi scenario, in report order: the rows brandi's token, scope, module, async-factory and
 * conditional-injection APIs express natively.
 */
import { buildBrandiAsyncScenarios } from "#/scenarios/brandi/async";
import { buildBrandiBindingVariantScenarios } from "#/scenarios/brandi/binding-variants";
import { buildBrandiBootScenarios } from "#/scenarios/brandi/boot";
import { buildBrandiConditionalScenarios } from "#/scenarios/brandi/conditional";
import { buildBrandiFailureScenarios } from "#/scenarios/brandi/failure";
import { buildBrandiFanOutScenarios } from "#/scenarios/brandi/fan-out";
import { buildBrandiMicroScenarios } from "#/scenarios/brandi/micro";
import { buildBrandiModuleScenarios } from "#/scenarios/brandi/module";
import { buildBrandiRealisticScenarios } from "#/scenarios/brandi/realistic";
import { buildBrandiRealisticClassScenarios } from "#/scenarios/brandi/realistic-class";
import { buildBrandiResolutionPatternScenarios } from "#/scenarios/brandi/resolution-patterns";
import { buildBrandiResolverLaneScenarios } from "#/scenarios/brandi/resolver-lanes";
import { buildBrandiScaleScenarios } from "#/scenarios/brandi/scale";
import { buildBrandiScopeScenarios } from "#/scenarios/brandi/scope";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every brandi bench scenario.
 */
export function collectAllBrandiScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildBrandiMicroScenarios(),
    ...buildBrandiRealisticScenarios(),
    ...buildBrandiRealisticClassScenarios(),
    ...buildBrandiFanOutScenarios(),
    ...buildBrandiConditionalScenarios(),
    ...buildBrandiModuleScenarios(),
    ...buildBrandiAsyncScenarios(),
    ...buildBrandiScopeScenarios(),
    ...buildBrandiScaleScenarios(),
    ...buildBrandiBootScenarios(),
    ...buildBrandiBindingVariantScenarios(),
    ...buildBrandiFailureScenarios(),
    ...buildBrandiResolutionPatternScenarios(),
    ...buildBrandiResolverLaneScenarios(),
  ];
}
