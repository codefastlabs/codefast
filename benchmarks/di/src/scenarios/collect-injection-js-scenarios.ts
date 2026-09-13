import { buildInjectionJsAliasScenarios } from "#/scenarios/injection-js/alias";
import { buildInjectionJsAsyncScenarios } from "#/scenarios/injection-js/async";
import { buildInjectionJsBindingVariantScenarios } from "#/scenarios/injection-js/binding-variants";
import { buildInjectionJsBootScenarios } from "#/scenarios/injection-js/boot";
import { buildInjectionJsFailureScenarios } from "#/scenarios/injection-js/failure";
/**
 * Every injection-js scenario, in report order: the singleton-friendly rows a `ReflectiveInjector`, which caches
 * every provider per injector, expresses natively — a transient root, collections, aliases, child injectors.
 */
import { buildInjectionJsFanOutScenarios } from "#/scenarios/injection-js/fan-out";
import { buildInjectionJsMicroScenarios } from "#/scenarios/injection-js/micro";
import { buildInjectionJsProductionScenarios } from "#/scenarios/injection-js/production";
import { buildInjectionJsRealisticScenarios } from "#/scenarios/injection-js/realistic";
import { buildInjectionJsRealisticClassScenarios } from "#/scenarios/injection-js/realistic-class";
import { buildInjectionJsResolutionPatternScenarios } from "#/scenarios/injection-js/resolution-patterns";
import { buildInjectionJsResolverLaneScenarios } from "#/scenarios/injection-js/resolver-lanes";
import { buildInjectionJsScopeScenarios } from "#/scenarios/injection-js/scope";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every injection-js bench scenario.
 */
export function collectAllInjectionJsScenarios(): ReadonlyArray<AnyScenario> {
  return [
    ...buildInjectionJsMicroScenarios(),
    ...buildInjectionJsRealisticScenarios(),
    ...buildInjectionJsRealisticClassScenarios(),
    ...buildInjectionJsFanOutScenarios(),
    ...buildInjectionJsScopeScenarios(),
    ...buildInjectionJsProductionScenarios(),
    ...buildInjectionJsBootScenarios(),
    ...buildInjectionJsAliasScenarios(),
    ...buildInjectionJsAsyncScenarios(),
    ...buildInjectionJsBindingVariantScenarios(),
    ...buildInjectionJsFailureScenarios(),
    ...buildInjectionJsResolutionPatternScenarios(),
    ...buildInjectionJsResolverLaneScenarios(),
  ];
}
