/** The `cn` row: calls shaped like a component library's own. */
import { cnTestCalls } from "#fixtures/cn";
import { CN_WITH_MERGE } from "#fixtures/scenario-parity";
import type { TvLibrary } from "#lib/tv-library";
import type { BenchScenario } from "#scenarios/types";

/** Builds the `cn` row for one library. */
export function buildCnScenarios(library: TvLibrary): ReadonlyArray<BenchScenario> {
  const cn = library.cn;

  return [
    {
      ...CN_WITH_MERGE,
      build: () => () => {
        for (const call of cnTestCalls) {
          cn(...call);
        }
      },
      output: () => cnTestCalls.map((call) => cn(...call)).join("\n"),
    },
  ];
}
