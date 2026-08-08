import { buildTailwindVariantsNpmComplexScenarios } from "#/scenarios/tailwind-variants/complex";
import { buildTailwindVariantsNpmCompoundSlotsScenarios } from "#/scenarios/tailwind-variants/compound-slots";
import { buildTailwindVariantsNpmConstructScenarios } from "#/scenarios/tailwind-variants/construct";
import { buildTailwindVariantsNpmCreateTvScenarios } from "#/scenarios/tailwind-variants/create-tv";
import { buildTailwindVariantsNpmExtendsScenarios } from "#/scenarios/tailwind-variants/extends";
import { buildTailwindVariantsNpmExtremeScenarios } from "#/scenarios/tailwind-variants/extreme";
import { buildTailwindVariantsNpmExtremeSlotsScenarios } from "#/scenarios/tailwind-variants/extreme-slots";
import { buildTailwindVariantsNpmRepeatScenarios } from "#/scenarios/tailwind-variants/repeat";
import { buildTailwindVariantsNpmSimpleScenarios } from "#/scenarios/tailwind-variants/simple";
import { buildTailwindVariantsNpmSlotsScenarios } from "#/scenarios/tailwind-variants/slots";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllTailwindVariantsNpmScenarios(): ReadonlyArray<AnyScenario> {
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
    ...buildTailwindVariantsNpmConstructScenarios(),
  ];
}
