import { buildInversifyAliasScenarios } from "#/scenarios/inversify/alias";
/**
 * Central list of all InversifyJS 8 bench scenarios. Used by the bench subprocess.
 */
import { buildInversifyAsyncScenarios } from "#/scenarios/inversify/async";
import { buildInversifyAsyncEntryPointScenarios } from "#/scenarios/inversify/async-entry-points";
import { buildInversifyBindingVariantScenarios } from "#/scenarios/inversify/binding-variants";
import { buildInversifyBootScenarios } from "#/scenarios/inversify/boot";
import { buildInversifyDisposeScaleScenarios } from "#/scenarios/inversify/dispose-scale";
import { buildInversifyFailureScenarios } from "#/scenarios/inversify/failure";
import { buildInversifyFanOutScenarios } from "#/scenarios/inversify/fan-out";
import { buildInversifyFreshChildScenarios } from "#/scenarios/inversify/fresh-child";
import { buildInversifyLifecycleScenarios } from "#/scenarios/inversify/lifecycle";
import { buildInversifyMicroScenarios } from "#/scenarios/inversify/micro";
import { buildInversifyModuleScenarios } from "#/scenarios/inversify/module";
import { buildInversifyProductionScenarios } from "#/scenarios/inversify/production";
import { buildInversifyRealisticScenarios } from "#/scenarios/inversify/realistic";
import { buildInversifyRealisticClassScenarios } from "#/scenarios/inversify/realistic-class";
import { buildInversifyRegistryOpsScenarios } from "#/scenarios/inversify/registry-ops";
import { buildInversifyResolutionPatternScenarios } from "#/scenarios/inversify/resolution-patterns";
import { buildInversifyResolverLaneScenarios } from "#/scenarios/inversify/resolver-lanes";
import { buildInversifyScaleScenarios } from "#/scenarios/inversify/scale";
import { buildInversifyScopeScenarios } from "#/scenarios/inversify/scope";
import { buildInversifySlotSelectionScenarios } from "#/scenarios/inversify/slot-selection";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllInversifyScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildInversifyMicroScenarios(),
    ...buildInversifyRealisticScenarios(),
    ...buildInversifyRealisticClassScenarios(),
    ...buildInversifyFanOutScenarios(),
    ...buildInversifyAsyncScenarios(),
    ...buildInversifyLifecycleScenarios(),
    ...buildInversifyDisposeScaleScenarios(),
    ...buildInversifyScopeScenarios(),
    ...buildInversifyScaleScenarios(),
    ...buildInversifyBootScenarios(),
    ...buildInversifyAliasScenarios(),
    ...buildInversifyAsyncEntryPointScenarios(),
    ...buildInversifyFreshChildScenarios(),
    ...buildInversifyResolverLaneScenarios(),
    ...buildInversifySlotSelectionScenarios(),
    ...buildInversifyFailureScenarios(),
    ...buildInversifyProductionScenarios(),
    ...buildInversifyBindingVariantScenarios(),
    ...buildInversifyResolutionPatternScenarios(),
    ...buildInversifyRegistryOpsScenarios(),
    ...buildInversifyModuleScenarios(),
  ];
}
