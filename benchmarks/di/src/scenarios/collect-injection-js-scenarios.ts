/**
 * Central list of all injection-js bench scenarios. Used by the bench
 * subprocess. `ReflectiveInjector` is singleton-per-injector with a non-cached
 * transient root, so it measures the constant and singleton-class micro rows,
 * the transient-root realistic row and the realistic cold-resolve. The
 * transient micro, fan-out and scale rows have no honest equivalent (sub-deps
 * stay cached singletons) and are omitted.
 */
import { buildInjectionJsMicroScenarios } from "#/scenarios/injection-js/micro";
import { buildInjectionJsRealisticScenarios } from "#/scenarios/injection-js/realistic";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every injection-js bench scenario.
 */
export function collectAllInjectionJsScenarios(): ReadonlyArray<AnyScenario> {
  return [...buildInjectionJsMicroScenarios(), ...buildInjectionJsRealisticScenarios()];
}
