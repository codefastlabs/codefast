import { buildAwilixAliasScenarios } from "#/scenarios/awilix/alias";
import { buildAwilixAsyncScenarios } from "#/scenarios/awilix/async";
import { buildAwilixBootScenarios } from "#/scenarios/awilix/boot";
import { buildAwilixDisposeScaleScenarios } from "#/scenarios/awilix/dispose-scale";
import { buildAwilixFailureScenarios } from "#/scenarios/awilix/failure";
/**
 * Every Awilix scenario, in report order: the rows awilix's registration, scope, alias, disposer and optional
 * APIs express natively.
 */
import { buildAwilixFanOutScenarios } from "#/scenarios/awilix/fan-out";
import { buildAwilixFreshChildScenarios } from "#/scenarios/awilix/fresh-child";
import { buildAwilixLifecycleScenarios } from "#/scenarios/awilix/lifecycle";
import { buildAwilixMicroScenarios } from "#/scenarios/awilix/micro";
import { buildAwilixProductionScenarios } from "#/scenarios/awilix/production";
import { buildAwilixRealisticScenarios } from "#/scenarios/awilix/realistic";
import { buildAwilixRealisticClassScenarios } from "#/scenarios/awilix/realistic-class";
import { buildAwilixRegistryOpsScenarios } from "#/scenarios/awilix/registry-ops";
import { buildAwilixResolutionPatternScenarios } from "#/scenarios/awilix/resolution-patterns";
import { buildAwilixResolverLaneScenarios } from "#/scenarios/awilix/resolver-lanes";
import { buildAwilixScaleScenarios } from "#/scenarios/awilix/scale";
import { buildAwilixScopeScenarios } from "#/scenarios/awilix/scope";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.5.0-canary.7
 */
export function collectAllAwilixScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildAwilixMicroScenarios(),
    ...buildAwilixRealisticScenarios(),
    ...buildAwilixRealisticClassScenarios(),
    ...buildAwilixFanOutScenarios(),
    ...buildAwilixScopeScenarios(),
    ...buildAwilixScaleScenarios(),
    ...buildAwilixProductionScenarios(),
    ...buildAwilixBootScenarios(),
    ...buildAwilixDisposeScaleScenarios(),
    ...buildAwilixAliasScenarios(),
    ...buildAwilixAsyncScenarios(),
    ...buildAwilixFailureScenarios(),
    ...buildAwilixFreshChildScenarios(),
    ...buildAwilixLifecycleScenarios(),
    ...buildAwilixRegistryOpsScenarios(),
    ...buildAwilixResolutionPatternScenarios(),
    ...buildAwilixResolverLaneScenarios(),
  ];
}
