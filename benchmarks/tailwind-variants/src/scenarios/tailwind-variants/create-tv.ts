import { buttonVariants, simpleTestProps } from "#/fixtures/create-tv";
import { CREATE_TV_WITH_MERGE, CREATE_TV_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsCreateTV } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const npmButtonNoMerge = tailwindVariantsCreateTV(TV_MERGE_DISABLED)(buttonVariants);
const npmButtonWithMerge = tailwindVariantsCreateTV(TV_MERGE_ENABLED)(buttonVariants);

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmCreateTvScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...CREATE_TV_WITHOUT_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          npmButtonNoMerge(props);
        }
      },
    },
    {
      ...CREATE_TV_WITH_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          npmButtonWithMerge(props);
        }
      },
    },
  ];
}
