import { tailwindVariantsCreateTV } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { buttonVariants, simpleTestProps } from "#/fixtures/create-tv";

const npmButtonNoMerge = tailwindVariantsCreateTV(TV_MERGE_DISABLED)(buttonVariants);
const npmButtonWithMerge = tailwindVariantsCreateTV(TV_MERGE_ENABLED)(buttonVariants);

export function buildTailwindVariantsNpmCreateTvScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "create-tv-without-merge",
      group: "create-tv",
      what: "createTV factory without tailwind-merge",
      build: () => () => {
        for (const props of simpleTestProps) {
          npmButtonNoMerge(props);
        }
      },
    },
    {
      id: "create-tv-with-merge",
      group: "create-tv",
      what: "createTV factory with tailwind-merge",
      build: () => () => {
        for (const props of simpleTestProps) {
          npmButtonWithMerge(props);
        }
      },
    },
  ];
}
