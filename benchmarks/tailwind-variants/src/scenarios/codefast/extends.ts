import { codefastTvFn } from "#/lib/tv-shims";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#/harness/bench-options";
import type { BenchScenario } from "#/scenarios/types";
import {
  extendsBaseVariants,
  extendsExtensionVariants,
  extendsTestProps,
} from "#/fixtures/extends";

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
export function buildCodefastExtendsScenarios(): readonly BenchScenario[] {
  return [
    {
      id: "extends-without-merge",
      group: "extends",
      what: "Extended tv config without tailwind-merge",
      build: () => () => {
        for (const props of extendsTestProps) {
          codefastExtendsNoMerge(props);
        }
      },
    },
    {
      id: "extends-with-merge",
      group: "extends",
      what: "Extended tv config with tailwind-merge on tv",
      build: () => () => {
        for (const props of extendsTestProps) {
          codefastExtendsWithMerge(props);
        }
      },
    },
  ];
}
