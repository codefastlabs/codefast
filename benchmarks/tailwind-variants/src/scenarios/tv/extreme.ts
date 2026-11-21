/** The `extreme-*` rows: a flat configuration with many variants and compounds. */
import { extremeTestProps, extremeVariants } from "#fixtures/extreme";
import { EXTREME_WITH_MERGE, EXTREME_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `extreme-*` rows for one library.
 *
 * @since 0.11.1
 */
export function buildExtremeScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(extremeVariants, TV_MERGE_DISABLED) as FlatRenderer;
  const withMerge = library.tv(extremeVariants, TV_MERGE_ENABLED) as FlatRenderer;

  return [
    {
      ...EXTREME_WITHOUT_MERGE,
      build: () => () => {
        for (const props of extremeTestProps) {
          noMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(noMerge, extremeTestProps),
    },
    {
      ...EXTREME_WITH_MERGE,
      build: () => () => {
        for (const props of extremeTestProps) {
          withMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(withMerge, extremeTestProps),
    },
  ];
}
