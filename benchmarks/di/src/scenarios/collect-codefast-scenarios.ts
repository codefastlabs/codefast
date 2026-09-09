/**
 * Central list of all `@codefast/di` bench scenarios. Used by the bench subprocess.
 */
import { buildCodefastAliasScenarios } from "#/scenarios/codefast/alias";
import { buildCodefastAsyncScenarios } from "#/scenarios/codefast/async";
import { buildCodefastAsyncEntryPointScenarios } from "#/scenarios/codefast/async-entry-points";
import { buildCodefastAsyncLaneScenarios } from "#/scenarios/codefast/async-lanes";
import { buildCodefastAsyncPlanScenarios } from "#/scenarios/codefast/async-plan";
import { buildCodefastBindingVariantScenarios } from "#/scenarios/codefast/binding-variants";
import { buildCodefastBootScenarios } from "#/scenarios/codefast/boot";
import { buildCodefastColdBootScenarios } from "#/scenarios/codefast/cold-boot";
import { buildCodefastDisposeScaleScenarios } from "#/scenarios/codefast/dispose-scale";
import { buildCodefastFailureScenarios } from "#/scenarios/codefast/failure";
import { buildCodefastFanOutScenarios } from "#/scenarios/codefast/fan-out";
import { buildCodefastFreshChildScenarios } from "#/scenarios/codefast/fresh-child";
import { buildCodefastGraphExportScenarios } from "#/scenarios/codefast/graph-export";
import { buildCodefastInitializeInspectScenarios } from "#/scenarios/codefast/initialize-inspect";
import { buildCodefastLifecycleScenarios } from "#/scenarios/codefast/lifecycle";
import { buildCodefastMicroScenarios } from "#/scenarios/codefast/micro";
import { buildCodefastModuleScenarios } from "#/scenarios/codefast/module";
import { buildCodefastMultiTagScenarios } from "#/scenarios/codefast/multi-tag-constraint";
import { buildCodefastPlanDepthScenarios } from "#/scenarios/codefast/plan-depth";
import { buildCodefastPlanEscapeScenarios } from "#/scenarios/codefast/plan-escape";
import { buildCodefastProductionScenarios } from "#/scenarios/codefast/production";
import { buildCodefastRealisticScenarios } from "#/scenarios/codefast/realistic";
import { buildCodefastRealisticGraphValidateScenarios } from "#/scenarios/codefast/realistic-graph-validate";
import { buildCodefastRegistryInvalidationScenarios } from "#/scenarios/codefast/registry-invalidation";
import { buildCodefastRegistryOpsScenarios } from "#/scenarios/codefast/registry-ops";
import { buildCodefastResolutionPatternScenarios } from "#/scenarios/codefast/resolution-patterns";
import { buildCodefastResolverLaneScenarios } from "#/scenarios/codefast/resolver-lanes";
import { buildCodefastScaleScenarios } from "#/scenarios/codefast/scale";
import { buildCodefastScopeScenarios } from "#/scenarios/codefast/scope";
import { buildCodefastSlotSelectionScenarios } from "#/scenarios/codefast/slot-selection";
import { buildCodefastTagKeyMaskScenarios } from "#/scenarios/codefast/tag-key-mask";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllCodefastScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildCodefastMicroScenarios(),
    ...buildCodefastRealisticScenarios(),
    ...buildCodefastRealisticGraphValidateScenarios(),
    ...buildCodefastFanOutScenarios(),
    ...buildCodefastAsyncScenarios(),
    ...buildCodefastAsyncLaneScenarios(),
    ...buildCodefastAsyncPlanScenarios(),
    ...buildCodefastAsyncEntryPointScenarios(),
    ...buildCodefastLifecycleScenarios(),
    ...buildCodefastScopeScenarios(),
    ...buildCodefastFreshChildScenarios(),
    ...buildCodefastScaleScenarios(),
    ...buildCodefastBootScenarios(),
    ...buildCodefastColdBootScenarios(),
    ...buildCodefastFailureScenarios(),
    ...buildCodefastProductionScenarios(),
    ...buildCodefastBindingVariantScenarios(),
    ...buildCodefastAliasScenarios(),
    ...buildCodefastResolutionPatternScenarios(),
    ...buildCodefastRegistryOpsScenarios(),
    ...buildCodefastRegistryInvalidationScenarios(),
    ...buildCodefastDisposeScaleScenarios(),
    ...buildCodefastModuleScenarios(),
    ...buildCodefastInitializeInspectScenarios(),
    ...buildCodefastGraphExportScenarios(),
    ...buildCodefastMultiTagScenarios(),
    ...buildCodefastTagKeyMaskScenarios(),
    ...buildCodefastSlotSelectionScenarios(),
    ...buildCodefastPlanEscapeScenarios(),
    ...buildCodefastPlanDepthScenarios(),
    ...buildCodefastResolverLaneScenarios(),
  ];
}
