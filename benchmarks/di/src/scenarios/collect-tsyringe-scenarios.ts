/**
 * Central list of all tsyringe bench scenarios (core subset). Used by the bench
 * subprocess. tsyringe supports the factory/class-binding core scenarios shared by
 * every library, plus the `resolveAll` strategy rows (via repeated `register`), the
 * per-scope lifetime row (`ContainerScoped` + child container), and the disposal row
 * (`dispose()` on a `Disposable`) — the codefast-only introspection rows are absent.
 */
import { buildTsyringeFanOutScenarios } from "#/scenarios/tsyringe/fan-out";
import { buildTsyringeLifecycleScenarios } from "#/scenarios/tsyringe/lifecycle";
import { buildTsyringeMicroScenarios } from "#/scenarios/tsyringe/micro";
import { buildTsyringeProductionScenarios } from "#/scenarios/tsyringe/production";
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
    ...buildTsyringeLifecycleScenarios(),
    ...buildTsyringeScaleScenarios(),
    ...buildTsyringeProductionScenarios(),
  ];
}
