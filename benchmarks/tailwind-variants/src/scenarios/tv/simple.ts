import { SIMPLE_WITH_MERGE, SIMPLE_WITHOUT_MERGE } from "#fixtures/scenario-parity";
/** The `simple-*` rows: a button's variants, called with fresh props each time. */
import { buttonVariants, simpleTestProps } from "#fixtures/simple";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/** Builds the `simple-*` rows for one library. */
export function buildSimpleScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(buttonVariants, TV_MERGE_DISABLED) as FlatRenderer;
  const withMerge = library.tv(buttonVariants, TV_MERGE_ENABLED) as FlatRenderer;

  return [
    {
      ...SIMPLE_WITHOUT_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          noMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(noMerge, simpleTestProps),
    },
    {
      ...SIMPLE_WITH_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          withMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(withMerge, simpleTestProps),
    },
  ];
}
