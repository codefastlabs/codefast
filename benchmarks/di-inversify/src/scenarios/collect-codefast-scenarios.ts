/**
 * Central list of all @codefast/di bench scenarios. Used by the bench subprocess.
 */
import { buildCodefastAsyncScenarios } from "#/scenarios/codefast/async";
import { buildCodefastBootScenarios } from "#/scenarios/codefast/boot";
import { buildCodefastFailureScenarios } from "#/scenarios/codefast/failure";
import { buildCodefastFanOutScenarios } from "#/scenarios/codefast/fan-out";
import { buildCodefastLifecycleScenarios } from "#/scenarios/codefast/lifecycle";
import { buildCodefastMicroScenarios } from "#/scenarios/codefast/micro";
import { buildCodefastRealisticScenarios } from "#/scenarios/codefast/realistic";
import { buildCodefastScaleScenarios } from "#/scenarios/codefast/scale";
import { buildCodefastScopeScenarios } from "#/scenarios/codefast/scope";
import type { AnyScenario } from "#/scenarios/types";

export function collectAllCodefastScenarios(): readonly AnyScenario[] {
  return [
    ...buildCodefastMicroScenarios(),
    ...buildCodefastRealisticScenarios(),
    ...buildCodefastFanOutScenarios(),
    ...buildCodefastAsyncScenarios(),
    ...buildCodefastLifecycleScenarios(),
    ...buildCodefastScopeScenarios(),
    ...buildCodefastScaleScenarios(),
    ...buildCodefastBootScenarios(),
    ...buildCodefastFailureScenarios(),
  ];
}
