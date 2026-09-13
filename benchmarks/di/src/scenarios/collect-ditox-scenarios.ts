import { buildDitoxAsyncScenarios } from "#/scenarios/ditox/async";
import { buildDitoxBindingVariantScenarios } from "#/scenarios/ditox/binding-variants";
import { buildDitoxBootScenarios } from "#/scenarios/ditox/boot";
import { buildDitoxDisposeScaleScenarios } from "#/scenarios/ditox/dispose-scale";
import { buildDitoxFailureScenarios } from "#/scenarios/ditox/failure";
/**
 * Every ditox scenario, in report order: the rows ditox's factory, hierarchy, module, collection and teardown
 * APIs express natively.
 */
import { buildDitoxFanOutScenarios } from "#/scenarios/ditox/fan-out";
import { buildDitoxFreshChildScenarios } from "#/scenarios/ditox/fresh-child";
import { buildDitoxLifecycleScenarios } from "#/scenarios/ditox/lifecycle";
import { buildDitoxMicroScenarios } from "#/scenarios/ditox/micro";
import { buildDitoxModuleScenarios } from "#/scenarios/ditox/module";
import { buildDitoxProductionScenarios } from "#/scenarios/ditox/production";
import { buildDitoxRealisticScenarios } from "#/scenarios/ditox/realistic";
import { buildDitoxRealisticClassScenarios } from "#/scenarios/ditox/realistic-class";
import { buildDitoxRegistryOpsScenarios } from "#/scenarios/ditox/registry-ops";
import { buildDitoxResolutionPatternScenarios } from "#/scenarios/ditox/resolution-patterns";
import { buildDitoxResolverLaneScenarios } from "#/scenarios/ditox/resolver-lanes";
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
    ...buildDitoxBootScenarios(),
    ...buildDitoxDisposeScaleScenarios(),
    ...buildDitoxAsyncScenarios(),
    ...buildDitoxBindingVariantScenarios(),
    ...buildDitoxFailureScenarios(),
    ...buildDitoxFreshChildScenarios(),
    ...buildDitoxRegistryOpsScenarios(),
    ...buildDitoxResolutionPatternScenarios(),
    ...buildDitoxResolverLaneScenarios(),
  ];
}
