/**
 * Central list of all InversifyJS 8 bench scenarios. Used by the bench subprocess.
 */
import { buildInversifyAsyncScenarios } from "#/scenarios/inversify/async";
import { buildInversifyBindingVariantScenarios } from "#/scenarios/inversify/binding-variants";
import { buildInversifyBootScenarios } from "#/scenarios/inversify/boot";
import { buildInversifyFailureScenarios } from "#/scenarios/inversify/failure";
import { buildInversifyFanOutScenarios } from "#/scenarios/inversify/fan-out";
import { buildInversifyLifecycleScenarios } from "#/scenarios/inversify/lifecycle";
import { buildInversifyMicroScenarios } from "#/scenarios/inversify/micro";
import { buildInversifyModuleScenarios } from "#/scenarios/inversify/module";
import { buildInversifyProductionScenarios } from "#/scenarios/inversify/production";
import { buildInversifyRealisticScenarios } from "#/scenarios/inversify/realistic";
import { buildInversifyRegistryOpsScenarios } from "#/scenarios/inversify/registry-ops";
import { buildInversifyResolutionPatternScenarios } from "#/scenarios/inversify/resolution-patterns";
import { buildInversifyScaleScenarios } from "#/scenarios/inversify/scale";
import { buildInversifyScopeScenarios } from "#/scenarios/inversify/scope";
import type { AnyScenario } from "#/scenarios/types";

export function collectAllInversifyScenarios(): readonly AnyScenario[] {
  return [
    ...buildInversifyMicroScenarios(),
    ...buildInversifyRealisticScenarios(),
    ...buildInversifyFanOutScenarios(),
    ...buildInversifyAsyncScenarios(),
    ...buildInversifyLifecycleScenarios(),
    ...buildInversifyScopeScenarios(),
    ...buildInversifyScaleScenarios(),
    ...buildInversifyBootScenarios(),
    ...buildInversifyFailureScenarios(),
    ...buildInversifyProductionScenarios(),
    ...buildInversifyBindingVariantScenarios(),
    ...buildInversifyResolutionPatternScenarios(),
    ...buildInversifyRegistryOpsScenarios(),
    ...buildInversifyModuleScenarios(),
  ];
}
