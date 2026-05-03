import { tailwindVariantsTv } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import {
  extendsBaseVariants,
  extendsExtensionVariants,
  extendsTestProps,
} from "#/fixtures/extends";

const npmBaseNoMerge = tailwindVariantsTv(extendsBaseVariants, TV_MERGE_DISABLED);
const npmBaseWithMerge = tailwindVariantsTv(extendsBaseVariants, TV_MERGE_ENABLED);

const npmExtendsNoMerge = tailwindVariantsTv(
  { ...extendsExtensionVariants, extend: npmBaseNoMerge },
  TV_MERGE_DISABLED,
);
const npmExtendsWithMerge = tailwindVariantsTv(
  { ...extendsExtensionVariants, extend: npmBaseWithMerge },
  TV_MERGE_ENABLED,
);

export function buildTailwindVariantsNpmExtendsScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "extends-without-merge",
      group: "extends",
      what: "Extended tv config without tailwind-merge",
      build: () => () => {
        for (const props of extendsTestProps) {
          npmExtendsNoMerge(props);
        }
      },
    },
    {
      id: "extends-with-merge",
      group: "extends",
      what: "Extended tv config with tailwind-merge on tv",
      build: () => () => {
        for (const props of extendsTestProps) {
          npmExtendsWithMerge(props);
        }
      },
    },
  ];
}
