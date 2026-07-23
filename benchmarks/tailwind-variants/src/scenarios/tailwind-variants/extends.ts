import { extendsBaseVariants, extendsExtensionVariants, extendsTestProps } from "#/fixtures/extends";
import { EXTENDS_WITH_MERGE, EXTENDS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { tailwindVariantsTv } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

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

/**
 * @since 0.3.16-canary.0
 */
export function buildTailwindVariantsNpmExtendsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...EXTENDS_WITHOUT_MERGE,
      build: () => () => {
        for (const props of extendsTestProps) {
          npmExtendsNoMerge(props);
        }
      },
    },
    {
      ...EXTENDS_WITH_MERGE,
      build: () => () => {
        for (const props of extendsTestProps) {
          npmExtendsWithMerge(props);
        }
      },
    },
  ];
}
