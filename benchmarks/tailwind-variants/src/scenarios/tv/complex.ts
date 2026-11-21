/** The `complex-*` rows: variants with compounds and booleans. */
import { complexTestProps, complexVariants } from "#fixtures/complex";
import { COMPLEX_WITH_MERGE, COMPLEX_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `complex-*` rows for one library.
 *
 * @since 0.11.1
 */
export function buildComplexScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(complexVariants, TV_MERGE_DISABLED) as FlatRenderer;
  const withMerge = library.tv(complexVariants, TV_MERGE_ENABLED) as FlatRenderer;

  return [
    {
      ...COMPLEX_WITHOUT_MERGE,
      build: () => () => {
        for (const props of complexTestProps) {
          noMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(noMerge, complexTestProps),
    },
    {
      ...COMPLEX_WITH_MERGE,
      build: () => () => {
        for (const props of complexTestProps) {
          withMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(withMerge, complexTestProps),
    },
  ];
}
