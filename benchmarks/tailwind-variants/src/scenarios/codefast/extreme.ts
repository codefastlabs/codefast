import { codefastTvFn } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { extremeTestProps, extremeVariants } from "#/fixtures/extreme";

const codefastNoMerge = codefastTvFn(extremeVariants, TV_MERGE_DISABLED);
const codefastWithMerge = codefastTvFn(extremeVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastExtremeScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      id: "extreme-without-merge",
      group: "extreme",
      what: "Large variant matrix without tailwind-merge",
      build: () => () => {
        for (const props of extremeTestProps) {
          codefastNoMerge(props);
        }
      },
    },
    {
      id: "extreme-with-merge",
      group: "extreme",
      what: "Large variant matrix with tailwind-merge on tv",
      build: () => () => {
        for (const props of extremeTestProps) {
          codefastWithMerge(props);
        }
      },
    },
  ];
}
