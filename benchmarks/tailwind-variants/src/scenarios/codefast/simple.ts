import { codefastTvFn } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";

const codefastNoMerge = codefastTvFn(buttonVariants, TV_MERGE_DISABLED);
const codefastWithMerge = codefastTvFn(buttonVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastSimpleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      id: "simple-without-merge",
      group: "simple",
      what: "Simple button variants without tailwind-merge",
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastNoMerge(props);
        }
      },
    },
    {
      id: "simple-with-merge",
      group: "simple",
      what: "Simple button variants with tailwind-merge on tv",
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastWithMerge(props);
        }
      },
    },
  ];
}
