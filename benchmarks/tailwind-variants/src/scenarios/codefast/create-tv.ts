import { buttonVariants, simpleTestProps } from "#/fixtures/create-tv";
import { CREATE_TV_WITH_MERGE, CREATE_TV_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { codefastCreateTV } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const { tv: codefastFactoryNoMerge } = codefastCreateTV(TV_MERGE_DISABLED);
const { tv: codefastFactoryWithMerge } = codefastCreateTV(TV_MERGE_ENABLED);

const codefastButtonNoMerge = codefastFactoryNoMerge(buttonVariants);
const codefastButtonWithMerge = codefastFactoryWithMerge(buttonVariants);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastCreateTvScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...CREATE_TV_WITHOUT_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastButtonNoMerge(props);
        }
      },
    },
    {
      ...CREATE_TV_WITH_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastButtonWithMerge(props);
        }
      },
    },
  ];
}
