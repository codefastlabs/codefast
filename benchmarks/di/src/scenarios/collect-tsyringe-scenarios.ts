import { buildTsyringeAliasScenarios } from "#/scenarios/tsyringe/alias";
import { buildTsyringeAsyncScenarios } from "#/scenarios/tsyringe/async";
import { buildTsyringeBindingVariantScenarios } from "#/scenarios/tsyringe/binding-variants";
import { buildTsyringeBootScenarios } from "#/scenarios/tsyringe/boot";
import { buildTsyringeDisposeScaleScenarios } from "#/scenarios/tsyringe/dispose-scale";
import { buildTsyringeFailureScenarios } from "#/scenarios/tsyringe/failure";
/**
 * Every tsyringe scenario, in report order: the rows tsyringe's class, child-container, collection, alias,
 * interceptor and disposal APIs express natively.
 */
import { buildTsyringeFanOutScenarios } from "#/scenarios/tsyringe/fan-out";
import { buildTsyringeFreshChildScenarios } from "#/scenarios/tsyringe/fresh-child";
import { buildTsyringeLifecycleScenarios } from "#/scenarios/tsyringe/lifecycle";
import { buildTsyringeMicroScenarios } from "#/scenarios/tsyringe/micro";
import { buildTsyringeProductionScenarios } from "#/scenarios/tsyringe/production";
import { buildTsyringeRealisticScenarios } from "#/scenarios/tsyringe/realistic";
import { buildTsyringeRealisticClassScenarios } from "#/scenarios/tsyringe/realistic-class";
import { buildTsyringeRegistryOpsScenarios } from "#/scenarios/tsyringe/registry-ops";
import { buildTsyringeResolverLaneScenarios } from "#/scenarios/tsyringe/resolver-lanes";
import { buildTsyringeScaleScenarios } from "#/scenarios/tsyringe/scale";
import { buildTsyringeScopeScenarios } from "#/scenarios/tsyringe/scope";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.5.0-canary.7
 */
export function collectAllTsyringeScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildTsyringeMicroScenarios(),
    ...buildTsyringeRealisticScenarios(),
    ...buildTsyringeRealisticClassScenarios(),
    ...buildTsyringeFanOutScenarios(),
    ...buildTsyringeScopeScenarios(),
    ...buildTsyringeLifecycleScenarios(),
    ...buildTsyringeScaleScenarios(),
    ...buildTsyringeProductionScenarios(),
    ...buildTsyringeBootScenarios(),
    ...buildTsyringeDisposeScaleScenarios(),
    ...buildTsyringeAliasScenarios(),
    ...buildTsyringeAsyncScenarios(),
    ...buildTsyringeBindingVariantScenarios(),
    ...buildTsyringeFailureScenarios(),
    ...buildTsyringeFreshChildScenarios(),
    ...buildTsyringeRegistryOpsScenarios(),
    ...buildTsyringeResolverLaneScenarios(),
  ];
}
