/** The `override` row: one button rendered from many call sites, each with its own `className`. */
import { overrideTestProps } from "#fixtures/override";
import { OVERRIDE_WITH_MERGE } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { codefastTvFn } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

const button = codefastTvFn(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;

/** Builds the `override` row. */
export function buildCodefastOverrideScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...OVERRIDE_WITH_MERGE,
      build: () => () => {
        for (const props of overrideTestProps) {
          button({ ...props });
        }
      },
    },
  ];
}
