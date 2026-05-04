import { buildClassVarianceAuthorityComplexScenarios } from "#/scenarios/class-variance-authority/complex";
import { buildClassVarianceAuthoritySimpleScenarios } from "#/scenarios/class-variance-authority/simple";
import type { AnyScenario } from "#/scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllClassVarianceAuthorityScenarios(): readonly AnyScenario[] {
  return [
    ...buildClassVarianceAuthoritySimpleScenarios(),
    ...buildClassVarianceAuthorityComplexScenarios(),
  ];
}
