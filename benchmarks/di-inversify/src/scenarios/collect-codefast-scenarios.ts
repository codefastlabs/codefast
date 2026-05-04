/**
 * Central list of all @codefast/di bench scenarios. Used by the bench subprocess.
 */
import { buildCodefastAsyncScenarios } from "#/scenarios/codefast/async";
import { buildCodefastBindingVariantScenarios } from "#/scenarios/codefast/binding-variants";
import { buildCodefastBootScenarios } from "#/scenarios/codefast/boot";
import { buildCodefastFailureScenarios } from "#/scenarios/codefast/failure";
import { buildCodefastFanOutScenarios } from "#/scenarios/codefast/fan-out";
import { buildCodefastInitializeInspectScenarios } from "#/scenarios/codefast/initialize-inspect";
import { buildCodefastLifecycleScenarios } from "#/scenarios/codefast/lifecycle";
import { buildCodefastMicroScenarios } from "#/scenarios/codefast/micro";
import { buildCodefastModuleScenarios } from "#/scenarios/codefast/module";
import { buildCodefastProductionScenarios } from "#/scenarios/codefast/production";
import { buildCodefastRealisticScenarios } from "#/scenarios/codefast/realistic";
import { buildCodefastRealisticGraphValidateScenarios } from "#/scenarios/codefast/realistic-graph-validate";
import { buildCodefastRegistryOpsScenarios } from "#/scenarios/codefast/registry-ops";
import { buildCodefastResolutionPatternScenarios } from "#/scenarios/codefast/resolution-patterns";
import { buildCodefastScaleScenarios } from "#/scenarios/codefast/scale";
import { buildCodefastScopeScenarios } from "#/scenarios/codefast/scope";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllCodefastScenarios(): readonly AnyScenario[] {
  return [
    ...buildCodefastMicroScenarios(),
    ...buildCodefastRealisticScenarios(),
    ...buildCodefastRealisticGraphValidateScenarios(),
    ...buildCodefastFanOutScenarios(),
    ...buildCodefastAsyncScenarios(),
    ...buildCodefastLifecycleScenarios(),
    ...buildCodefastScopeScenarios(),
    ...buildCodefastScaleScenarios(),
    ...buildCodefastBootScenarios(),
    ...buildCodefastFailureScenarios(),
    ...buildCodefastProductionScenarios(),
    ...buildCodefastBindingVariantScenarios(),
    ...buildCodefastResolutionPatternScenarios(),
    ...buildCodefastRegistryOpsScenarios(),
    ...buildCodefastModuleScenarios(),
    ...buildCodefastInitializeInspectScenarios(),
  ];
}
