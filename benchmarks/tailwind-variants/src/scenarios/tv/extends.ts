/** The `extends-*` rows: a configuration that extends another resolver's. */
import { extendsBaseVariants, extendsExtensionVariants, extendsTestProps } from "#fixtures/extends";
import { EXTENDS_WITH_MERGE, EXTENDS_WITHOUT_MERGE } from "#fixtures/scenario-parity";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_DISABLED, TV_MERGE_ENABLED } from "#harness/bench-options";
import { joinFlatRenders } from "#lib/render-slots";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/** Builds the `extends-*` rows for one library. */
export function buildExtendsScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const noMerge = library.tv(
    { ...extendsExtensionVariants, extend: library.tv(extendsBaseVariants, TV_MERGE_DISABLED) },
    TV_MERGE_DISABLED,
  ) as FlatRenderer;
  const withMerge = library.tv(
    { ...extendsExtensionVariants, extend: library.tv(extendsBaseVariants, TV_MERGE_ENABLED) },
    TV_MERGE_ENABLED,
  ) as FlatRenderer;

  return [
    {
      ...EXTENDS_WITHOUT_MERGE,
      build: () => () => {
        for (const props of extendsTestProps) {
          noMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(noMerge, extendsTestProps),
    },
    {
      ...EXTENDS_WITH_MERGE,
      build: () => () => {
        for (const props of extendsTestProps) {
          withMerge({ ...props });
        }
      },
      output: () => joinFlatRenders(withMerge, extendsTestProps),
    },
  ];
}
