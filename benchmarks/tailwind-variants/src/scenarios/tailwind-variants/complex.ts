import { tailwindVariantsTv } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import { complexTestProps, complexVariants } from "#/fixtures/complex";

const npmNoMerge = tailwindVariantsTv(complexVariants, TV_MERGE_DISABLED);
const npmWithMerge = tailwindVariantsTv(complexVariants, TV_MERGE_ENABLED);

export function buildTailwindVariantsNpmComplexScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "complex-without-merge",
      group: "complex",
      what: "Complex variants (compounds, booleans) without tailwind-merge",
      build: () => () => {
        for (const props of complexTestProps) {
          npmNoMerge(props);
        }
      },
    },
    {
      id: "complex-with-merge",
      group: "complex",
      what: "Complex variants with tailwind-merge on tv",
      build: () => () => {
        for (const props of complexTestProps) {
          npmWithMerge(props);
        }
      },
    },
  ];
}
