import { buildCodefastComplexScenarios } from "#/scenarios/codefast/complex";
import { buildCodefastCompoundSlotsScenarios } from "#/scenarios/codefast/compound-slots";
import { buildCodefastCreateTvScenarios } from "#/scenarios/codefast/create-tv";
import { buildCodefastDefineOnlyScenarios } from "#/scenarios/codefast/define-only";
import { buildCodefastExtendsScenarios } from "#/scenarios/codefast/extends";
import { buildCodefastExtremeScenarios } from "#/scenarios/codefast/extreme";
import { buildCodefastExtremeSlotsScenarios } from "#/scenarios/codefast/extreme-slots";
import { buildCodefastFirstRenderScenarios } from "#/scenarios/codefast/first-render";
import { buildCodefastRepeatScenarios } from "#/scenarios/codefast/repeat";
import { buildCodefastSimpleScenarios } from "#/scenarios/codefast/simple";
import { buildCodefastSlotsScenarios } from "#/scenarios/codefast/slots";
import { buildCodefastUncachedScenarios } from "#/scenarios/codefast/uncached";
import type { BenchScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllCodefastScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...buildCodefastSimpleScenarios(),
    ...buildCodefastComplexScenarios(),
    ...buildCodefastSlotsScenarios(),
    ...buildCodefastCompoundSlotsScenarios(),
    ...buildCodefastExtendsScenarios(),
    ...buildCodefastCreateTvScenarios(),
    ...buildCodefastExtremeScenarios(),
    ...buildCodefastExtremeSlotsScenarios(),
    ...buildCodefastRepeatScenarios(),
    ...buildCodefastUncachedScenarios(),
    ...buildCodefastDefineOnlyScenarios(),
    ...buildCodefastFirstRenderScenarios(),
  ];
}
