import { buildTailwindVariantsNpmCompoundSlotsScenarios } from "#/scenarios/tailwind-variants/compound-slots";
import { buildTailwindVariantsNpmComplexScenarios } from "#/scenarios/tailwind-variants/complex";
import { buildTailwindVariantsNpmCreateTvScenarios } from "#/scenarios/tailwind-variants/create-tv";
import { buildTailwindVariantsNpmExtremeScenarios } from "#/scenarios/tailwind-variants/extreme";
import { buildTailwindVariantsNpmExtremeSlotsScenarios } from "#/scenarios/tailwind-variants/extreme-slots";
import { buildTailwindVariantsNpmExtendsScenarios } from "#/scenarios/tailwind-variants/extends";
import { buildTailwindVariantsNpmSimpleScenarios } from "#/scenarios/tailwind-variants/simple";
import { buildTailwindVariantsNpmSlotsScenarios } from "#/scenarios/tailwind-variants/slots";
import type { AnyScenario } from "#/scenarios/types";

export function collectAllTailwindVariantsNpmScenarios(): readonly AnyScenario[] {
  return [
    ...buildTailwindVariantsNpmSimpleScenarios(),
    ...buildTailwindVariantsNpmComplexScenarios(),
    ...buildTailwindVariantsNpmSlotsScenarios(),
    ...buildTailwindVariantsNpmCompoundSlotsScenarios(),
    ...buildTailwindVariantsNpmExtendsScenarios(),
    ...buildTailwindVariantsNpmCreateTvScenarios(),
    ...buildTailwindVariantsNpmExtremeScenarios(),
    ...buildTailwindVariantsNpmExtremeSlotsScenarios(),
  ];
}
