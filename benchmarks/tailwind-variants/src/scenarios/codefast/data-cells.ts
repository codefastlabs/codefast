/** The `data-cells` row: table cells whose selection and `className` come from row and column data. */
import { DATA_CELLS_PER_ITERATION, dataCellTestCalls, dataCellVariants } from "#fixtures/data-cells";
import { DATA_CELLS_WITH_MERGE } from "#fixtures/scenario-parity";
import { TV_MERGE_ENABLED } from "#harness/bench-options";
import { codefastTvFn } from "#lib/tv-shims";
import type { BenchScenario } from "#scenarios/types";

/** Builds the `data-cells` row. */
export function buildCodefastDataCellsScenarios(): ReadonlyArray<BenchScenario> {
  return [
    {
      ...DATA_CELLS_WITH_MERGE,
      build: () => {
        const cell = codefastTvFn(dataCellVariants, TV_MERGE_ENABLED) as (props: Record<string, unknown>) => string;
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
    },
  ];
}
