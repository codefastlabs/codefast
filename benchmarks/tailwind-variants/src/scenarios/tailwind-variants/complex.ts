import { complexTestProps, complexVariants } from "#/fixtures/complex";
import { COMPLEX_WITH_MERGE, COMPLEX_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const npmNoMerge = tailwindVariantsTv(complexVariants, TV_MERGE_DISABLED);
const npmWithMerge = tailwindVariantsTv(complexVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmComplexScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...COMPLEX_WITHOUT_MERGE,
      build: () => () => {
        for (const props of complexTestProps) {
          npmNoMerge(props);
        }
      },
    },
    {
      ...COMPLEX_WITH_MERGE,
      build: () => () => {
        for (const props of complexTestProps) {
          npmWithMerge(props);
        }
      },
    },
  ];
}
