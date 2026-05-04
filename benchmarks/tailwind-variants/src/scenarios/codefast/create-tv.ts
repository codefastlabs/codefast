import { codefastCreateTV } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { buttonVariants, simpleTestProps } from "#/fixtures/create-tv";

const { tv: codefastFactoryNoMerge } = codefastCreateTV(TV_MERGE_DISABLED);
const { tv: codefastFactoryWithMerge } = codefastCreateTV(TV_MERGE_ENABLED);

const codefastButtonNoMerge = codefastFactoryNoMerge(buttonVariants);
const codefastButtonWithMerge = codefastFactoryWithMerge(buttonVariants);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastCreateTvScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "create-tv-without-merge",
      group: "create-tv",
      what: "createTV factory without tailwind-merge",
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastButtonNoMerge(props);
        }
      },
    },
    {
      id: "create-tv-with-merge",
      group: "create-tv",
      what: "createTV factory with tailwind-merge",
      build: () => () => {
        for (const props of simpleTestProps) {
          codefastButtonWithMerge(props);
        }
      },
    },
  ];
}
