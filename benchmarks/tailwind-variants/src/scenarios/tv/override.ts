/** The `override` row: one button rendered from many call sites, each with its own `className`. */
import { overrideTestProps } from "#fixtures/override";
import { OVERRIDE_WITH_MERGE } from "#fixtures/scenario-parity";
import { buttonVariants } from "#fixtures/simple";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/** Builds the `override` row for one library. */
export function buildOverrideScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const button = library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;

  return [
    {
      ...OVERRIDE_WITH_MERGE,
      build: () => () => {
        for (const props of overrideTestProps) {
          button({ ...props });
        }
      },
      output: () => joinFlatRenders(button, overrideTestProps),
    },
  ];
}
