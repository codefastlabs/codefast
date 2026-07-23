import { SIMPLE_WITH_MERGE, SIMPLE_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { buttonVariants, simpleTestProps } from "#/fixtures/simple";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const codefastNoMerge = codefastTvFn(buttonVariants, TV_MERGE_DISABLED);
const codefastWithMerge = codefastTvFn(buttonVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastSimpleScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...SIMPLE_WITHOUT_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastNoMerge(props);
        }
      },
    },
    {
      ...SIMPLE_WITH_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastWithMerge(props);
        }
      },
    },
  ];
}
