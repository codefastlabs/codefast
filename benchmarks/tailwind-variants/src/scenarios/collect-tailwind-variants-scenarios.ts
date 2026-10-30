import { buildTailwindVariantsNpmCnScenarios } from "#scenarios/tailwind-variants/cn";
import { buildTailwindVariantsNpmComplexScenarios } from "#scenarios/tailwind-variants/complex";
import { buildTailwindVariantsNpmCompoundSlotsScenarios } from "#scenarios/tailwind-variants/compound-slots";
import { buildTailwindVariantsNpmCreateTvScenarios } from "#scenarios/tailwind-variants/create-tv";
import { buildTailwindVariantsNpmDataCellsScenarios } from "#scenarios/tailwind-variants/data-cells";
import { buildTailwindVariantsNpmDefineOnlyScenarios } from "#scenarios/tailwind-variants/define-only";
import { buildTailwindVariantsNpmExtendsScenarios } from "#scenarios/tailwind-variants/extends";
import { buildTailwindVariantsNpmExtremeScenarios } from "#scenarios/tailwind-variants/extreme";
import { buildTailwindVariantsNpmExtremeSlotsScenarios } from "#scenarios/tailwind-variants/extreme-slots";
import { buildTailwindVariantsNpmFewRendersScenarios } from "#scenarios/tailwind-variants/few-renders";
import { buildTailwindVariantsNpmFirstRenderScenarios } from "#scenarios/tailwind-variants/first-render";
import { buildTailwindVariantsNpmOverrideScenarios } from "#scenarios/tailwind-variants/override";
import { buildTailwindVariantsNpmRepeatScenarios } from "#scenarios/tailwind-variants/repeat";
import { buildTailwindVariantsNpmSimpleScenarios } from "#scenarios/tailwind-variants/simple";
import { buildTailwindVariantsNpmSlotClassScenarios } from "#scenarios/tailwind-variants/slot-class";
import { buildTailwindVariantsNpmSlotsScenarios } from "#scenarios/tailwind-variants/slots";
import { buildTailwindVariantsNpmWideSlotsScenarios } from "#scenarios/tailwind-variants/wide-slots";
import type { BenchScenario } from "#scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllTailwindVariantsNpmScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...buildTailwindVariantsNpmSimpleScenarios(),
    ...buildTailwindVariantsNpmComplexScenarios(),
    ...buildTailwindVariantsNpmSlotsScenarios(),
    ...buildTailwindVariantsNpmCompoundSlotsScenarios(),
    ...buildTailwindVariantsNpmExtendsScenarios(),
    ...buildTailwindVariantsNpmCreateTvScenarios(),
    ...buildTailwindVariantsNpmExtremeScenarios(),
    ...buildTailwindVariantsNpmExtremeSlotsScenarios(),
    ...buildTailwindVariantsNpmRepeatScenarios(),
    ...buildTailwindVariantsNpmDefineOnlyScenarios(),
    ...buildTailwindVariantsNpmFirstRenderScenarios(),
    ...buildTailwindVariantsNpmCnScenarios(),
    ...buildTailwindVariantsNpmOverrideScenarios(),
    ...buildTailwindVariantsNpmSlotClassScenarios(),
    ...buildTailwindVariantsNpmDataCellsScenarios(),
    ...buildTailwindVariantsNpmWideSlotsScenarios(),
    ...buildTailwindVariantsNpmFewRendersScenarios(),
  ];
}
