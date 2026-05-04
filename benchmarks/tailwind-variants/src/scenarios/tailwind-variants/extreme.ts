import { tailwindVariantsTv } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { extremeTestProps, extremeVariants } from "#/fixtures/extreme";

const npmNoMerge = tailwindVariantsTv(extremeVariants, TV_MERGE_DISABLED);
const npmWithMerge = tailwindVariantsTv(extremeVariants, TV_MERGE_ENABLED);

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmExtremeScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "extreme-without-merge",
      group: "extreme",
      what: "Large variant matrix without tailwind-merge",
      build: () => () => {
        for (const props of extremeTestProps) {
          npmNoMerge(props);
        }
      },
    },
    {
      id: "extreme-with-merge",
      group: "extreme",
      what: "Large variant matrix with tailwind-merge on tv",
      build: () => () => {
        for (const props of extremeTestProps) {
          npmWithMerge(props);
        }
      },
    },
  ];
}
