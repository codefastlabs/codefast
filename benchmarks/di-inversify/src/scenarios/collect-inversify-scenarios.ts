/**
 * Central list of all InversifyJS 8 bench scenarios. Used by the bench subprocess.
 */
import { buildInversifyAsyncScenarios } from "#/scenarios/inversify/async";
import { buildInversifyBootScenarios } from "#/scenarios/inversify/boot";
import { buildInversifyFanOutScenarios } from "#/scenarios/inversify/fan-out";
import { buildInversifyLifecycleScenarios } from "#/scenarios/inversify/lifecycle";
import { buildInversifyMicroScenarios } from "#/scenarios/inversify/micro";
import { buildInversifyRealisticScenarios } from "#/scenarios/inversify/realistic";
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
  ];
}
