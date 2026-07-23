import { extremeTestProps, extremeVariants } from "#/fixtures/extreme";
import { EXTREME_WITH_MERGE, EXTREME_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const npmNoMerge = tailwindVariantsTv(extremeVariants, TV_MERGE_DISABLED);
const npmWithMerge = tailwindVariantsTv(extremeVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmExtremeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...EXTREME_WITHOUT_MERGE,
      build: () => () => {
        for (const props of extremeTestProps) {
          npmNoMerge(props);
        }
      },
    },
    {
      ...EXTREME_WITH_MERGE,
      build: () => () => {
        for (const props of extremeTestProps) {
          npmWithMerge(props);
        }
      },
    },
  ];
}
