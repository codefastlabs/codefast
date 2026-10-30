import { buildClassVarianceAuthorityCnScenarios } from "#scenarios/class-variance-authority/cn";
import { buildClassVarianceAuthorityComplexScenarios } from "#scenarios/class-variance-authority/complex";
import { buildClassVarianceAuthorityOverrideScenarios } from "#scenarios/class-variance-authority/override";
import { buildClassVarianceAuthoritySimpleScenarios } from "#scenarios/class-variance-authority/simple";
import { buildClassVarianceAuthorityUniqueClassScenarios } from "#scenarios/class-variance-authority/unique-class";
import type { BenchScenario } from "#scenarios/types";

/**
 * @since 0.3.16-canary.0
 */
export function collectAllClassVarianceAuthorityScenarios(): ReadonlyArray<BenchScenario> {
  return [
    ...buildClassVarianceAuthoritySimpleScenarios(),
    ...buildClassVarianceAuthorityComplexScenarios(),
    ...buildClassVarianceAuthorityCnScenarios(),
    ...buildClassVarianceAuthorityOverrideScenarios(),
    ...buildClassVarianceAuthorityUniqueClassScenarios(),
  ];
}
