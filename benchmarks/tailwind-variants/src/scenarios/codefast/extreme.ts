import { extremeTestProps, extremeVariants } from "#/fixtures/extreme";
import { EXTREME_WITH_MERGE, EXTREME_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const codefastNoMerge = codefastTvFn(extremeVariants, TV_MERGE_DISABLED);
const codefastWithMerge = codefastTvFn(extremeVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastExtremeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...EXTREME_WITHOUT_MERGE,
      build: () => () => {
        for (const props of extremeTestProps) {
          codefastNoMerge(props);
        }
      },
    },
    {
      ...EXTREME_WITH_MERGE,
      build: () => () => {
        for (const props of extremeTestProps) {
          codefastWithMerge(props);
        }
      },
    },
  ];
}
