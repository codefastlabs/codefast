/**
 * Central list of all tsyringe bench scenarios (core subset). Used by the bench
 * subprocess. tsyringe supports the factory/class-binding core scenarios shared by
 * every library, plus the `resolveAll` strategy rows (via repeated `register`) and
 * the per-scope lifetime row (`ContainerScoped` + child container) — the
 * codefast-only introspection/lifecycle rows are absent.
 */
import { buildTsyringeFanOutScenarios } from "#/scenarios/tsyringe/fan-out";
import { buildTsyringeMicroScenarios } from "#/scenarios/tsyringe/micro";
import { buildTsyringeRealisticScenarios } from "#/scenarios/tsyringe/realistic";
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
    ...buildTsyringeFanOutScenarios(),
    ...buildTsyringeScopeScenarios(),
    ...buildTsyringeScaleScenarios(),
  ];
}
