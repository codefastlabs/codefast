/** The `data-cells` row: table cells whose selection and `className` come from row and column data. */
import { DATA_CELLS_PER_ITERATION, dataCellTestCalls, dataCellVariants } from "#fixtures/data-cells";
import { DATA_CELLS_WITH_MERGE } from "#fixtures/scenario-parity";
import type { FlatRenderer } from "#fixtures/slot-types";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds the `data-cells` row for one library.
 *
 * @since 0.11.1
 */
export function buildDataCellsScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  return [
    {
      ...DATA_CELLS_WITH_MERGE,
      build: () => {
        const cell = library.tv(dataCellVariants, TV_MERGE_ENABLED) as FlatRenderer;
        let cursor = 0;

        return () => {
          for (let index = 0; index < DATA_CELLS_PER_ITERATION; index++) {
            const call = dataCellTestCalls[cursor];

            cursor = cursor + 1 === dataCellTestCalls.length ? 0 : cursor + 1;

            if (call !== undefined) {
              cell({ ...call.props, className: call.className });
            }
          }
        };
      },
      // Every call the timed loop cycles through, not only one iteration's slice of them.
      output: () => {
        const cell = library.tv(dataCellVariants, TV_MERGE_ENABLED) as FlatRenderer;

        return dataCellTestCalls.map((call) => cell({ ...call.props, className: call.className })).join("\n");
      },
    },
  ];
}
