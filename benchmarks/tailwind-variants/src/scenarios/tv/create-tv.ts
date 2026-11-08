/** The `create-tv-*` rows: a resolver from the library's `createTV` factory, the factory call outside the timed loop. */
import { buttonVariants, simpleTestProps } from "#fixtures/create-tv";
import { CREATE_TV_WITH_MERGE, CREATE_TV_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `create-tv-*` rows for one library.
 *
 * @since 0.11.1
 */
export function buildCreateTvScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.createTv(TV_MERGE_DISABLED)(buttonVariants) as FlatRenderer;
  const withMerge = library.createTv(TV_MERGE_ENABLED)(buttonVariants) as FlatRenderer;

  return [
    {
      ...CREATE_TV_WITHOUT_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          noMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(noMerge, simpleTestProps),
    },
    {
      ...CREATE_TV_WITH_MERGE,
      build: () => () => {
        for (const props of simpleTestProps) {
          withMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(withMerge, simpleTestProps),
    },
  ];
}
