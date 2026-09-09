/**
 * Central list of all iti bench scenarios. Used by the bench subprocess. iti
 * bindings are memoized singletons with no transient scope, so it measures only
 * the singleton-friendly rows: the constant and singleton-class micro rows and
 * the realistic cold-resolve. The transient micro, hot transient-root, fan-out
 * and scale rows have no honest iti equivalent and are omitted.
 */
import { buildItiMicroScenarios } from "#/scenarios/iti/micro";
import { buildItiRealisticScenarios } from "#/scenarios/iti/realistic";
import type { AnyScenario } from "#/scenarios/types";

/**
 * Collects every iti bench scenario.
 */
export function collectAllItiScenarios(): ReadonlyArray<AnyScenario> {
  return [...buildItiMicroScenarios(), ...buildItiRealisticScenarios()];
}
