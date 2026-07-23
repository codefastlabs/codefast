import { extendsBaseVariants, extendsExtensionVariants, extendsTestProps } from "#/fixtures/extends";
import { EXTENDS_WITH_MERGE, EXTENDS_WITHOUT_MERGE } from "#/fixtures/scenario-parity";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import { codefastTvFn } from "#/lib/tv-shims";
import type { BenchScenario } from "#/scenarios/types";

const codefastBaseNoMerge = codefastTvFn(extendsBaseVariants, TV_MERGE_DISABLED);
const codefastBaseWithMerge = codefastTvFn(extendsBaseVariants, TV_MERGE_ENABLED);

const codefastExtendsNoMerge = codefastTvFn(
  { ...extendsExtensionVariants, extend: codefastBaseNoMerge },
  TV_MERGE_DISABLED,
);
const codefastExtendsWithMerge = codefastTvFn(
  { ...extendsExtensionVariants, extend: codefastBaseWithMerge },
  TV_MERGE_ENABLED,
);

/**
 * @since 0.3.16-canary.0
 */
export function buildCodefastExtendsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...EXTENDS_WITHOUT_MERGE,
      build: () => () => {
        for (const props of extendsTestProps) {
          codefastExtendsNoMerge(props);
        }
      },
    },
    {
      ...EXTENDS_WITH_MERGE,
      build: () => () => {
        for (const props of extendsTestProps) {
          codefastExtendsWithMerge(props);
        }
      },
    },
  ];
}
