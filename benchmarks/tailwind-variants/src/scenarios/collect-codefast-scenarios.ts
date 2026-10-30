import { buildCodefastCnScenarios } from "#scenarios/codefast/cn";
import { buildCodefastComplexScenarios } from "#scenarios/codefast/complex";
import { buildCodefastCompoundSlotsScenarios } from "#scenarios/codefast/compound-slots";
import { buildCodefastCreateTvScenarios } from "#scenarios/codefast/create-tv";
import { buildCodefastDataCellsScenarios } from "#scenarios/codefast/data-cells";
import { buildCodefastDefineOnlyScenarios } from "#scenarios/codefast/define-only";
import { buildCodefastExtendsScenarios } from "#scenarios/codefast/extends";
import { buildCodefastExtremeScenarios } from "#scenarios/codefast/extreme";
import { buildCodefastExtremeSlotsScenarios } from "#scenarios/codefast/extreme-slots";
import { buildCodefastFewRendersScenarios } from "#scenarios/codefast/few-renders";
import { buildCodefastFirstRenderScenarios } from "#scenarios/codefast/first-render";
import { buildCodefastNovelClassesScenarios } from "#scenarios/codefast/novel-classes";
import { buildCodefastOverrideScenarios } from "#scenarios/codefast/override";
import { buildCodefastRepeatScenarios } from "#scenarios/codefast/repeat";
import { buildCodefastSimpleScenarios } from "#scenarios/codefast/simple";
import { buildCodefastSlotClassScenarios } from "#scenarios/codefast/slot-class";
import { buildCodefastSlotsScenarios } from "#scenarios/codefast/slots";
import { buildCodefastUncachedScenarios } from "#scenarios/codefast/uncached";
import { buildCodefastWideSlotsScenarios } from "#scenarios/codefast/wide-slots";
import type { BenchScenario } from "#scenarios/types";

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
    ...buildCodefastCnScenarios(),
    ...buildCodefastOverrideScenarios(),
    ...buildCodefastSlotClassScenarios(),
    ...buildCodefastDataCellsScenarios(),
    ...buildCodefastWideSlotsScenarios(),
    ...buildCodefastNovelClassesScenarios(),
    ...buildCodefastFewRendersScenarios(),
  ];
}
