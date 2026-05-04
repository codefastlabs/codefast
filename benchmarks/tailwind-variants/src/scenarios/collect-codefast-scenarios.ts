import { buildCodefastCompoundSlotsScenarios } from "#/scenarios/codefast/compound-slots";
import { buildCodefastComplexScenarios } from "#/scenarios/codefast/complex";
import { buildCodefastCreateTvScenarios } from "#/scenarios/codefast/create-tv";
import { buildCodefastExtremeScenarios } from "#/scenarios/codefast/extreme";
import { buildCodefastExtremeSlotsScenarios } from "#/scenarios/codefast/extreme-slots";
import { buildCodefastExtendsScenarios } from "#/scenarios/codefast/extends";
import { buildCodefastSimpleScenarios } from "#/scenarios/codefast/simple";
import { buildCodefastSlotsScenarios } from "#/scenarios/codefast/slots";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllCodefastScenarios(): readonly AnyScenario[] {
  return [
    ...buildCodefastSimpleScenarios(),
    ...buildCodefastComplexScenarios(),
    ...buildCodefastSlotsScenarios(),
    ...buildCodefastCompoundSlotsScenarios(),
    ...buildCodefastExtendsScenarios(),
    ...buildCodefastCreateTvScenarios(),
    ...buildCodefastExtremeScenarios(),
    ...buildCodefastExtremeSlotsScenarios(),
  ];
}
