import { codefastTvFn } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { complexTestProps, complexVariants } from "#/fixtures/complex";

const codefastNoMerge = codefastTvFn(complexVariants, TV_MERGE_DISABLED);
const codefastWithMerge = codefastTvFn(complexVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastComplexScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      id: "complex-without-merge",
      group: "complex",
      what: "Complex variants (compounds, booleans) without tailwind-merge",
      build: () => () => {
        for (const props of complexTestProps) {
          codefastNoMerge(props);
        }
      },
    },
    {
      id: "complex-with-merge",
      group: "complex",
      what: "Complex variants with tailwind-merge on tv",
      build: () => () => {
        for (const props of complexTestProps) {
          codefastWithMerge(props);
        }
      },
    },
  ];
}
